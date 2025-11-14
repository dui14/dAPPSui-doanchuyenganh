const express = require('express');
const router = express.Router();
const sql = require('mssql');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

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
  const { student_email, org_id, certificate_type, description, ipfs_cid_list = [] } = req.body;

  if (!student_email || !org_id || !certificate_type || !description) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const request_code = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    const orgCheck = await pool.request()
      .input('org_id', org_id)
      .query('SELECT id FROM dbo.organizations WHERE id = @org_id AND status = \'approved\'');

    if (orgCheck.recordset.length === 0) {
      return res.status(400).json({ error: 'Tổ chức không tồn tại hoặc chưa được duyệt' });
    }

    await pool.request()
      .input('request_code', request_code)
      .input('student_email', student_email)
      .input('org_id', org_id)
      .input('ipfs_cid_list', JSON.stringify(ipfs_cid_list))
      .input('note', JSON.stringify({ certificate_type, description }))
      .input('status', 'pending')
      .query(`
        INSERT INTO dbo.certificate_requests 
        (request_code, student_email, org_id, ipfs_cid_list, note, status)
        VALUES (@request_code, @student_email, @org_id, @ipfs_cid_list, @note, @status)
      `);

    await pool.request()
      .input('action', 'create_request')
      .input('actor_email', student_email)
      .input('target', 'certificate_request')
      .input('target_id', null)
      .input('details', JSON.stringify({ request_code, org_id }))
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

module.exports = router;