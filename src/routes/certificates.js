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

  // Validate đầu vào
  if (!student_email || !org_id || !certificate_type || !description) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const request_code = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // Kiểm tra org tồn tại
    const orgCheck = await pool.request()
      .input('org_id', org_id)
      .query('SELECT id FROM dbo.organizations WHERE id = @org_id AND status = \'approved\'');

    if (orgCheck.recordset.length === 0) {
      return res.status(400).json({ error: 'Tổ chức không tồn tại hoặc chưa được duyệt' });
    }

    // Insert yêu cầu
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

    // Ghi log
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

// PUT: Cập nhật trạng thái yêu cầu (admin dùng)
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

    await pool.request()
      .input('id', id)
      .input('status', status)
      .input('admin_org_email', admin_org_email || null)
      .input('org_email', org_email || null)
      .input('root_email', root_email || null)
      .input('ipfs_cid_list', ipfs_cid_list ? JSON.stringify(ipfs_cid_list) : null)
      .query(`
        UPDATE dbo.certificate_requests
        SET status = @status,
            admin_org_email = @admin_org_email,
            org_email = @org_email,
            root_email = @root_email,
            ipfs_cid_list = @ipfs_cid_list,
            updated_at = SYSUTCDATETIME()
        WHERE id = @id
      `);

    // Ghi log
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

// POST: Xác minh chứng chỉ
router.post('/verify', async (req, res) => {
  const { cert_id } = req.body;
  if (!cert_id) {
    return res.status(400).json({ error: 'Thiếu cert_id' });
  }

  try {
    const result = await pool.request()
      .input('cert_id', cert_id)
      .query('SELECT * FROM dbo.certificates WHERE cert_id = @cert_id AND status = \'minted\'');
    
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