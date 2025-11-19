const express = require('express');
const router = express.Router();
const sql = require('mssql');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const multer = require('multer'); // Xử lý upload file
const { uploadToPinata, uploadMetadataToPinata, getIPFSUrl } = require('../services/ipfs');

// Cấu hình Multer (lưu file tạm trong memory)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// GET: Lấy danh sách yêu cầu (loại bỏ rejected)
router.get('/requests', async (req, res) => {
  try {
    const result = await pool.request()
      .query(`SELECT * FROM dbo.certificate_requests WHERE status != 'rejected' ORDER BY created_at DESC`);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('GET /requests error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST: Tạo yêu cầu mới
router.post('/requests', async (req, res) => {
  const { student_email, admin_org_email, certificate_type, description, ipfs_cid_list = [] } = req.body;

  if (!student_email || !admin_org_email || !certificate_type || !description) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (cần có admin_org_email)' });
  }

  const request_code = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // Lấy org_id từ admin_org_email
    const adminOrgResult = await pool.request()
      .input('admin_org_email', sql.NVarChar, admin_org_email)
      .query(`
        SELECT org_id 
        FROM dbo.users 
        WHERE email = @admin_org_email 
          AND role = 'admin_org' 
          AND status = 'active'
      `);

    if (adminOrgResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Khoa không tồn tại hoặc không hoạt động' });
    }

    const org_id = adminOrgResult.recordset[0].org_id;

    // Kiểm tra org đã được duyệt chưa
    const orgCheck = await pool.request()
      .input('org_id', org_id)
      .query('SELECT id FROM dbo.organizations WHERE id = @org_id AND status = \'approved\'');

    if (orgCheck.recordset.length === 0) {
      return res.status(400).json({ error: 'Tổ chức chưa được phê duyệt' });
    }

    // Tạo request
    await pool.request()
      .input('request_code', request_code)
      .input('student_email', student_email)
      .input('admin_org_email', admin_org_email)
      .input('org_id', org_id)
      .input('ipfs_cid_list', JSON.stringify(ipfs_cid_list))
      .input('note', JSON.stringify({ certificate_type, description }))
      .input('status', 'pending')
      .query(`
        INSERT INTO dbo.certificate_requests 
        (request_code, student_email, admin_org_email, org_id, ipfs_cid_list, note, status)
        VALUES (@request_code, @student_email, @admin_org_email, @org_id, @ipfs_cid_list, @note, @status)
      `);

    await pool.request()
      .input('action', 'create_request')
      .input('actor_email', student_email)
      .input('target', 'certificate_request')
      .input('target_id', null)
      .input('details', JSON.stringify({ request_code, org_id, admin_org_email }))
      .query(`
        INSERT INTO dbo.logs (action, actor_email, target, target_id, details)
        VALUES (@action, @actor_email, @target, @target_id, @details)
      `);

    res.json({ success: true, request_code });
  } catch (error) {
    console.error('POST /requests error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT: Cập nhật trạng thái yêu cầu
router.put('/requests/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { status, admin_org_email, org_email, root_email, ipfs_cid_list } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Thiếu trạng thái' });
  }

  try {
    const validStatuses = ['pending','org_checked','org_approved','root_signed','minted','rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    let updateQuery = `
      UPDATE dbo.certificate_requests
      SET status = @status,
          updated_at = SYSUTCDATETIME()
    `;

    const request = pool.request()
      .input('id', id)
      .input('status', status);

    if (status === 'org_checked' && admin_org_email) {
      updateQuery += `, admin_org_email = @admin_org_email`;
      request.input('admin_org_email', admin_org_email);
    } else if (status === 'org_approved' && org_email) {
      updateQuery += `, org_email = @org_email`;
      request.input('org_email', org_email);
    } else if (status === 'root_signed' && root_email) {
      updateQuery += `, root_email = @root_email`;
      request.input('root_email', root_email);
    }

    if (ipfs_cid_list) {
      updateQuery += `, ipfs_cid_list = @ipfs_cid_list`;
      request.input('ipfs_cid_list', JSON.stringify(ipfs_cid_list));
    }

    updateQuery += ` WHERE id = @id`;

    await request.query(updateQuery);

    const actor = admin_org_email || org_email || root_email || 'system';
    await pool.request()
      .input('action', 'update_request')
      .input('actor_email', actor)
      .input('target', 'certificate_request')
      .input('target_id', id)
      .input('details', JSON.stringify({ status, actor }))
      .query(`
        INSERT INTO dbo.logs (action, actor_email, target, target_id, details)
        VALUES (@action, @actor_email, @target, @target_id, @details)
      `);

    res.json({ success: true });
  } catch (error) {
    console.error('PUT /requests error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST: Bộ ký số và cấp NFT (QUAN TRỌNG NHẤT)
router.post('/requests/:id/mint', authenticate, async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin_root') {
    return res.status(403).json({ error: 'Chỉ Bộ Giáo dục mới được thực hiện hành động này' });
  }

  try {
    const requestResult = await pool.request()
      .input('id', id)
      .query(`
        SELECT cr.*, o.org_name 
        FROM dbo.certificate_requests cr
        JOIN dbo.organizations o ON cr.org_id = o.id
        WHERE cr.id = @id AND cr.status = 'org_approved'
      `);

    if (requestResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Yêu cầu không tồn tại hoặc chưa được Trường phê duyệt' });
    }

    const request = requestResult.recordset[0];
    const note = request.note ? JSON.parse(request.note) : {};
    const cert_id = `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const tx_hash = `0x${'a'.repeat(64)}`; // Giả lập (thực tế là hash từ SUI)

    // Lưu vào bảng certificates
    await pool.request()
      .input('cert_id', cert_id)
      .input('student_email', request.student_email)
      .input('issued_by', req.user.email)
      .input('org_id', request.org_id)
      .input('ipfs_cid', request.ipfs_cid_list ? JSON.stringify(request.ipfs_cid_list) : null)
      .input('status', 'minted')
      .input('tx_hash', tx_hash)
      .query(`
        INSERT INTO dbo.certificates 
        (cert_id, student_email, issued_by, org_id, ipfs_cid, status, tx_hash)
        VALUES (@cert_id, @student_email, @issued_by, @org_id, @ipfs_cid, @status, @tx_hash)
      `);

    // Cập nhật trạng thái request
    await pool.request()
      .input('id', id)
      .input('root_email', req.user.email)
      .query(`
        UPDATE dbo.certificate_requests 
        SET status = 'minted', root_email = @root_email, updated_at = SYSUTCDATETIME()
        WHERE id = @id
      `);

    // Ghi log
    await pool.request()
      .input('action', 'mint_certificate')
      .input('actor_email', req.user.email)
      .input('target', 'certificate')
      .input('target_id', cert_id)
      .input('details', JSON.stringify({ request_id: id, tx_hash }))
      .query(`
        INSERT INTO dbo.logs (action, actor_email, target, target_id, details)
        VALUES (@action, @actor_email, @target, @target_id, @details)
      `);

    res.json({
      success: true,
      cert_id,
      tx_hash,
      message: 'Cấp chứng chỉ NFT thành công! Đã lưu vĩnh viễn.'
    });

  } catch (error) {
    console.error('POST /mint error:', error);
    res.status(500).json({ error: error.message || 'Lỗi khi cấp chứng chỉ' });
  }
});

// GET: Sinh viên xem chứng chỉ của mình
router.get('/certificates/mine', authenticate, async (req, res) => {
  try {
    const result = await pool.request()
      .input('student_email', req.user.email)
      .query(`
        SELECT c.*, o.org_name 
        FROM dbo.certificates c
        JOIN dbo.organizations o ON c.org_id = o.id
        WHERE c.student_email = @student_email AND c.status = 'minted'
        ORDER BY c.created_at DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('GET /certificates/mine error:', error);
    res.status(500).json({ error: 'Lỗi tải chứng chỉ' });
  }
});

// POST: Xác minh chứng chỉ (công khai)
router.post('/verify', async (req, res) => {
  const { cert_id } = req.body;
  if (!cert_id) {
    return res.status(400).json({ error: 'Thiếu cert_id' });
  }

  try {
    const result = await pool.request()
      .input('cert_id', cert_id)
      .query(`
        SELECT c.*, o.org_name 
        FROM dbo.certificates c
        JOIN dbo.organizations o ON c.org_id = o.id
        WHERE c.cert_id = @cert_id AND c.status = 'minted'
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Chứng chỉ không tồn tại hoặc đã bị thu hồi' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('POST /verify error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Tạo yêu cầu MỚI (có upload ảnh lên IPFS)
router.post('/requests/org', authenticate, upload.single('certificate_image'), async (req, res) => {
  const { student_email, admin_org_email, certificate_type, description } = req.body;
  const org_id = req.user.org_id; // Lấy org_id từ user đang login

  if (!student_email || !admin_org_email || !certificate_type || !description) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  if (!org_id) {
    return res.status(403).json({ error: 'User chưa được gán vào tổ chức nào' });
  }

  try {
    // BƯỚC 1: Kiểm tra sinh viên đã được Khoa duyệt chưa
    const khaoCheckResult = await pool.request()
      .input('student_email', sql.NVarChar, student_email)
      .input('admin_org_email', sql.NVarChar, admin_org_email)
      .input('org_id', sql.Int, org_id)
      .query(`
        SELECT id FROM dbo.certificate_requests
        WHERE student_email = @student_email 
          AND admin_org_email = @admin_org_email
          AND org_id = @org_id
          AND status = 'org_checked'
      `);

    if (khaoCheckResult.recordset.length === 0) {
      return res.status(400).json({ 
        error: 'Sinh viên này chưa được Khoa phê duyệt hoặc chưa có yêu cầu từ Khoa' 
      });
    }

    // BƯỚC 2: Upload ảnh lên IPFS (nếu có)
    let ipfs_cid = null;
    if (req.file) {
      ipfs_cid = await uploadToPinata(req.file.buffer, req.file.originalname);
      console.log(`📌 Uploaded certificate image to IPFS: ${ipfs_cid}`);
    }

    // BƯỚC 3: Tạo metadata JSON và upload lên IPFS
    const metadata = {
      name: `${certificate_type} - ${student_email}`,
      description: description,
      image: ipfs_cid ? getIPFSUrl(ipfs_cid) : null,
      attributes: [
        { trait_type: "Type", value: certificate_type },
        { trait_type: "Student", value: student_email },
        { trait_type: "Issued By", value: admin_org_email },
        { trait_type: "Approved By", value: req.user.email },
        { trait_type: "Organization ID", value: org_id.toString() },
        { trait_type: "Issue Date", value: new Date().toISOString() }
      ]
    };

    const metadata_cid = await uploadMetadataToPinata(metadata);
    console.log(`📌 Uploaded metadata to IPFS: ${metadata_cid}`);

    // BƯỚC 4: Tạo certificate request mới
    const request_code = `REQ-ORG-${Date.now()}`;

    await pool.request()
      .input('request_code', sql.NVarChar, request_code)
      .input('student_email', sql.NVarChar, student_email)
      .input('admin_org_email', sql.NVarChar, admin_org_email)
      .input('org_email', sql.NVarChar, req.user.email)
      .input('org_id', sql.Int, org_id)
      .input('ipfs_cid_list', sql.NVarChar, JSON.stringify({ 
        image: ipfs_cid, 
        metadata: metadata_cid 
      }))
      .input('note', sql.NVarChar, JSON.stringify({
        certificate_type,
        description,
        created_by: req.user.email
      }))
      .input('status', sql.NVarChar, 'org_approved') // Trường đã duyệt → Gửi lên Bộ
      .query(`
        INSERT INTO dbo.certificate_requests 
        (request_code, student_email, admin_org_email, org_email, org_id, ipfs_cid_list, note, status)
        VALUES (@request_code, @student_email, @admin_org_email, @org_email, @org_id, @ipfs_cid_list, @note, @status)
      `);

    // Ghi log
    await pool.request()
      .input('action', sql.NVarChar, 'create_org_certificate_request')
      .input('actor_email', sql.NVarChar, req.user.email)
      .input('target', sql.NVarChar, 'certificate_request')
      .input('details', sql.NVarChar, JSON.stringify({ request_code, ipfs_cid, metadata_cid }))
      .query(`
        INSERT INTO dbo.logs (action, actor_email, target, details)
        VALUES (@action, @actor_email, @target, @details)
      `);

    res.json({ 
      success: true, 
      request_code,
      ipfs_image: ipfs_cid ? getIPFSUrl(ipfs_cid) : null,
      ipfs_metadata: getIPFSUrl(metadata_cid)
    });
  } catch (error) {
    console.error('POST /requests/org error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Lấy danh sách sinh viên đủ điều kiện (đã được Khoa duyệt)
router.get('/eligible-students', authenticate, async (req, res) => {
  const org_id = req.user.org_id;

  if (!org_id) {
    return res.status(403).json({ error: 'User chưa thuộc tổ chức nào' });
  }

  console.log(`🔍 Fetching eligible students for org_id: ${org_id}`); // ← THÊM LOG

  try {
    const result = await pool.request()
      .input('org_id', sql.Int, org_id)
      .query(`
        SELECT DISTINCT 
          cr.student_email,
          cr.admin_org_email,
          u.display_name as admin_org_name,
          MAX(cr.created_at) as last_request_date
        FROM dbo.certificate_requests cr
        LEFT JOIN dbo.users u ON cr.admin_org_email = u.email
        WHERE cr.org_id = @org_id 
          AND cr.status = 'org_checked'
        GROUP BY cr.student_email, cr.admin_org_email, u.display_name
        ORDER BY last_request_date DESC
      `);

    console.log(`✅ Found ${result.recordset.length} eligible students`); // ← THÊM LOG
    console.log('Result:', JSON.stringify(result.recordset, null, 2)); // ← DEBUG

    res.json(result.recordset);
  } catch (error) {
    console.error('GET /eligible-students error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET danh sách tất cả certificates (cho admin_org xem)
router.get('/', authenticate, async (req, res) => {
  try {
    let query = `
      SELECT c.*, o.org_name 
      FROM dbo.certificates c
      JOIN dbo.organizations o ON c.org_id = o.id
      WHERE c.status = 'minted'
    `;

    // Nếu là admin_org thì chỉ xem chứng chỉ của org mình
    if (req.user.role === 'admin_org') {
      query += ` AND c.org_id = @org_id`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const request = pool.request();
    
    if (req.user.role === 'admin_org') {
      if (!req.user.org_id) {
        return res.status(403).json({ error: 'User chưa thuộc tổ chức nào' });
      }
      request.input('org_id', sql.Int, req.user.org_id);
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('GET /certificates error:', error);
    res.status(500).json({ error: 'Lỗi tải chứng chỉ' });
  }
});

// xử lý kết quả từ Bộ (webhook từ blockchain event)
router.post('/ministry-callback', async (req, res) => {
  const { request_code, approved, tx_hash, reason } = req.body;

  if (!request_code || approved === undefined) {
    return res.status(400).json({ error: 'Thiếu thông tin' });
  }

  try {
    // Tìm request trong database
    const request = await pool.request()
      .input('request_code', request_code)
      .query('SELECT * FROM dbo.certificate_requests WHERE request_code = @request_code');

    if (request.recordset.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
    }

    const req_id = request.recordset[0].id;

    if (approved) {
      // Bộ duyệt → Cập nhật status = 'root_signed'
      await pool.request()
        .input('id', req_id)
        .input('status', 'root_signed')
        .input('tx_hash', tx_hash)
        .query(`
          UPDATE dbo.certificate_requests 
          SET status = @status, 
              root_email = 'ministry@edu.gov.vn',
              updated_at = GETUTCDATE()
          WHERE id = @id
        `);

      res.json({ success: true, message: 'Bộ đã duyệt yêu cầu' });
    } else {
      // Bộ từ chối
      await pool.request()
        .input('id', req_id)
        .input('status', 'rejected')
        .input('reason', reason || 'Bộ từ chối')
        .query(`
          UPDATE dbo.certificate_requests 
          SET status = @status,
              note = @reason,
              updated_at = GETUTCDATE()
          WHERE id = @id
        `);

      res.json({ success: true, message: 'Bộ đã từ chối yêu cầu' });
    }

  } catch (error) {
    console.error('Ministry callback error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lấy danh sách Admin Khoa để sinh viên chọn
router.get('/available-admin-orgs', authenticate, async (req, res) => {
  try {
    const result = await pool.request()
      .query(`
        SELECT 
          u.email,
          u.display_name,
          o.org_name,
          o.id as org_id
        FROM dbo.users u
        JOIN dbo.organizations o ON u.org_id = o.id
        WHERE u.role = 'admin_org' 
          AND u.status = 'active'
          AND o.status = 'approved'
        ORDER BY o.org_name, u.display_name
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('GET /available-admin-orgs error:', error);
    res.status(500).json({ error: 'Lỗi tải danh sách khoa' });
  }
});

module.exports = router;