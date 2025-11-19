const express = require('express');
const router = express.Router();
const sql = require('mssql');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// TRƯỜNG
// GET: Lấy tất cả tổ chức
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin_root') {
      return res.status(403).json({ error: 'Chỉ admin_root mới có quyền xem' });
    }

    const result = await pool.request()
      .query(`
        SELECT o.*, u.display_name as owner_name, u.email as owner_email
        FROM dbo.organizations o
        LEFT JOIN dbo.users u ON o.owner_id = u.id
        ORDER BY o.created_at DESC
      `);
    
    res.json(result.recordset);
  } catch (error) {
    console.error('GET /organizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Lấy thông tin 1 tổ chức theo ID
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin_root') {
      // Kiểm tra user có phải owner của org này không
      const ownerCheck = await pool.request()
        .input('org_id', sql.Int, id)
        .input('user_id', sql.Int, req.user.id)
        .query('SELECT id FROM dbo.organizations WHERE id = @org_id AND owner_id = @user_id');

      if (ownerCheck.recordset.length === 0) {
        return res.status(403).json({ 
          error: 'Không có quyền truy cập tổ chức này',
          details: 'Bạn không phải owner của tổ chức này'
        });
      }
    }

    // Lấy thông tin tổ chức
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT o.*, u.display_name as owner_name, u.email as owner_email
        FROM dbo.organizations o
        LEFT JOIN dbo.users u ON o.owner_id = u.id
        WHERE o.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Tổ chức không tồn tại' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('GET /organizations/:id error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Tạo tổ chức mới (ĐÃ SỬA LỖI)
router.post('/', authenticate, async (req, res) => {
  const { org_name, org_email, owner_email, owner_display_name, org_wallet } = req.body;

  // Validate đầu vào
  if (!org_name || !org_email || !owner_email || !owner_display_name) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (org_name, org_email, owner_email, owner_display_name)' });
  }

  // Kiểm tra quyền admin_root
  if (req.user.role !== 'admin_root') {
    return res.status(403).json({ error: 'Không có quyền' });
  }

  try {
    // BƯỚC 1: Kiểm tra xem owner_email đã tồn tại chưa
    const existingUser = await pool.request()
      .input('email', sql.NVarChar, owner_email)
      .query('SELECT id FROM dbo.users WHERE email = @email');

    let owner_id;

    if (existingUser.recordset.length > 0) {
      // User đã tồn tại → Lấy ID
      owner_id = existingUser.recordset[0].id;
      console.log(`Owner đã tồn tại: ${owner_email} (ID: ${owner_id})`);
    } else {
      // BƯỚC 2: Tạo User mới với role = 'org'
      const newUser = await pool.request()
        .input('email', sql.NVarChar, owner_email)
        .input('display_name', sql.NVarChar, owner_display_name)
        .input('wallet_address', sql.NVarChar, org_wallet || null)
        .input('role', sql.NVarChar, 'org') // Tự động gán role
        .input('status', sql.NVarChar, 'active') // Mặc định active
        .query(`
          INSERT INTO dbo.users (email, display_name, wallet_address, role, status)
          OUTPUT INSERTED.id
          VALUES (@email, @display_name, @wallet_address, @role, @status)
        `);

      owner_id = newUser.recordset[0].id;
      console.log(`✅ Đã tạo Owner mới: ${owner_email} (ID: ${owner_id})`);
    }

    // BƯỚC 3: Tạo Organization VÀ LẤY org_id (QUAN TRỌNG!)
    const orgResult = await pool.request()
      .input('org_name', sql.NVarChar, org_name)
      .input('org_email', sql.NVarChar, org_email)
      .input('owner_id', sql.Int, owner_id)
      .input('org_wallet', sql.NVarChar, org_wallet || null)
      .input('status', sql.NVarChar, 'pending')
      .query(`
        INSERT INTO dbo.organizations 
        (org_name, org_email, owner_id, org_wallet, status)
        OUTPUT INSERTED.id
        VALUES (@org_name, @org_email, @owner_id, @org_wallet, @status)
      `);

    // LẤY org_id VỪA TẠO
    const org_id = orgResult.recordset[0].id;
    console.log(`✅ Đã tạo Organization: ${org_name} (ID: ${org_id})`);

    // BƯỚC 4: CẬP NHẬT org_id CHO OWNER
    await pool.request()
      .input('owner_id', sql.Int, owner_id)
      .input('org_id', sql.Int, org_id)
      .query(`
        UPDATE dbo.users
        SET org_id = @org_id,
            updated_at = SYSUTCDATETIME()
        WHERE id = @owner_id
      `);

    console.log(`✅ Đã gán org_id=${org_id} cho user_id=${owner_id}`);

    // BƯỚC 5: Ghi log
    await pool.request()
      .input('action', sql.NVarChar, 'create_organization')
      .input('actor_email', sql.NVarChar, req.user.email)
      .input('target', sql.NVarChar, 'organization')
      .input('details', sql.NVarChar, JSON.stringify({ 
        org_name, 
        org_email, 
        owner_id, 
        org_id 
      }))
      .query(`
        INSERT INTO dbo.logs (action, actor_email, target, details)
        VALUES (@action, @actor_email, @target, @details)
      `);

    res.json({ 
      success: true, 
      message: 'Tạo tổ chức thành công',
      owner_id,
      org_id,  // ← Trả về cho frontend
      org_name 
    });
  } catch (error) {
    console.error('POST /organizations error:', error);
    
    // Xử lý lỗi trùng email tổ chức
    if (error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Email tổ chức đã tồn tại' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// PUT: Cập nhật tổ chức
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { org_name, org_email, org_wallet, status } = req.body;

  try {
    if (req.user.role !== 'admin_root') {
      return res.status(403).json({ error: 'Không có quyền' });
    }

    // Lấy thông tin tổ chức cũ
    const orgResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT owner_id FROM dbo.organizations WHERE id = @id');

    if (orgResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Tổ chức không tồn tại' });
    }

    const owner_id = orgResult.recordset[0].owner_id;

    // Cập nhật tổ chức
    await pool.request()
      .input('id', sql.Int, id)
      .input('org_name', sql.NVarChar, org_name)
      .input('org_email', sql.NVarChar, org_email)
      .input('org_wallet', sql.NVarChar, org_wallet || null)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE dbo.organizations 
        SET org_name = @org_name,
            org_email = @org_email,
            org_wallet = @org_wallet,
            status = @status,
            updated_at = SYSUTCDATETIME()
        WHERE id = @id
      `);

    // ĐỒNG BỘ: Cập nhật status của Owner trong bảng users
    const userStatus = (status === 'approved') ? 'active' : 
                       (status === 'revoked') ? 'suspended' : 'active';

    await pool.request()
      .input('owner_id', sql.Int, owner_id)
      .input('user_status', sql.NVarChar, userStatus)
      .query(`
        UPDATE dbo.users
        SET status = @user_status,
            updated_at = SYSUTCDATETIME()
        WHERE id = @owner_id
      `);

    // Ghi log
    await pool.request()
      .input('action', sql.NVarChar, 'update_organization')
      .input('actor_email', sql.NVarChar, req.user.email)
      .input('target', sql.NVarChar, 'organization')
      .input('details', sql.NVarChar, JSON.stringify({ org_id: id, status, user_status: userStatus }))
      .query(`
        INSERT INTO dbo.logs (action, actor_email, target, details)
        VALUES (@action, @actor_email, @target, @details)
      `);

    res.json({ 
      success: true, 
      message: 'Cập nhật thành công',
      synced_user_status: userStatus 
    });
  } catch (error) {
    console.error('PUT /organizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Xóa tổ chức
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== 'admin_root') {
      return res.status(403).json({ error: 'Không có quyền' });
    }

    // Kiểm tra xem tổ chức có đang có chứng chỉ nào không
    const certCheck = await pool.request()
      .input('org_id', sql.Int, id)
      .query('SELECT COUNT(*) as count FROM dbo.certificates WHERE org_id = @org_id');

    if (certCheck.recordset[0].count > 0) {
      return res.status(400).json({ 
        error: 'Không thể xóa tổ chức đã cấp chứng chỉ. Hãy thu hồi quyền thay vì xóa.' 
      });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM dbo.organizations WHERE id = @id');

    await pool.request()
      .input('action', sql.NVarChar, 'delete_organization')
      .input('actor_email', sql.NVarChar, req.user.email)
      .input('target', sql.NVarChar, 'organization')
      .input('details', sql.NVarChar, JSON.stringify({ org_id: id }))
      .query(`
        INSERT INTO dbo.logs (action, actor_email, target, details)
        VALUES (@action, @actor_email, @target, @details)
      `);

    res.json({ success: true, message: 'Xóa tổ chức thành công' });
  } catch (error) {
    console.error('DELETE /organizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET: Thống kê tổng quan
router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin_root') {
      return res.status(403).json({ error: 'Không có quyền' });
    }

    const stats = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM dbo.organizations WHERE status = 'approved') as total_orgs,
        (SELECT COUNT(*) FROM dbo.certificates WHERE status = 'minted') as total_certs,
        (SELECT COUNT(*) FROM dbo.certificate_requests WHERE status = 'org_approved') as pending_requests,
        (SELECT COUNT(*) FROM dbo.users WHERE status = 'active') as total_users
    `);

    res.json(stats.recordset[0]);
  } catch (error) {
    console.error('GET /stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ...existing code...

// KHOA
// GET: Lấy danh sách Admin Khoa thuộc Trường (theo org_id)
router.get('/:orgId/admins', authenticate, async (req, res) => {
  const { orgId } = req.params;

  try {
    // Kiểm tra quyền: Chỉ owner của org này hoặc admin_root
    if (req.user.role !== 'admin_root') {
      const orgCheck = await pool.request()
        .input('org_id', sql.Int, orgId)
        .input('user_id', sql.Int, req.user.id)
        .query('SELECT id FROM dbo.organizations WHERE id = @org_id AND owner_id = @user_id');

      if (orgCheck.recordset.length === 0) {
        return res.status(403).json({ error: 'Không có quyền truy cập' });
      }
    }

    // Lấy danh sách admin_org thuộc org này
    const result = await pool.request()
      .input('org_id', sql.Int, orgId)
      .query(`
        SELECT id, email, display_name, wallet_address, role, status, created_at
        FROM dbo.users
        WHERE org_id = @org_id AND role = 'admin_org'
        ORDER BY created_at DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('GET /organizations/:orgId/admins error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST: Tạo Admin Khoa mới cho Trường
router.post('/:orgId/admins', authenticate, async (req, res) => {
  const { orgId } = req.params;
  const { email, display_name, wallet_address } = req.body;

  if (!email || !display_name) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (email, display_name)' });
  }

  try {
    // Kiểm tra quyền owner
    const orgCheck = await pool.request()
      .input('org_id', sql.Int, orgId)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id, org_name FROM dbo.organizations WHERE id = @org_id AND owner_id = @user_id AND status = \'approved\'');

    if (orgCheck.recordset.length === 0) {
      return res.status(403).json({ error: 'Chỉ Owner của tổ chức đã duyệt mới được tạo Admin Khoa' });
    }

    const orgName = orgCheck.recordset[0].org_name;

    // Kiểm tra email đã tồn tại
    const existingUser = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM dbo.users WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Tạo Admin Khoa mới
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('display_name', sql.NVarChar, display_name)
      .input('wallet_address', sql.NVarChar, wallet_address || null)
      .input('role', sql.NVarChar, 'admin_org')
      .input('org_id', sql.Int, orgId)
      .input('status', sql.NVarChar, 'active')
      .query(`
        INSERT INTO dbo.users (email, display_name, wallet_address, role, org_id, status)
        OUTPUT INSERTED.id
        VALUES (@email, @display_name, @wallet_address, @role, @org_id, @status)
      `);

    const userId = result.recordset[0].id;

    // Ghi log
    await pool.request()
      .input('action', sql.NVarChar, 'create_admin_org')
      .input('actor_email', sql.NVarChar, req.user.email)
      .input('target', sql.NVarChar, 'user')
      .input('details', sql.NVarChar, JSON.stringify({ user_id: userId, email, org_id: orgId }))
      .query(`
        INSERT INTO dbo.logs (action, actor_email, target, details)
        VALUES (@action, @actor_email, @target, @details)
      `);

    res.json({
      success: true,
      message: `Đã thêm Admin Khoa vào ${orgName}`,
      user_id: userId
    });
  } catch (error) {
    console.error('POST /organizations/:orgId/admins error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT: Cập nhật thông tin Admin Khoa
router.put('/:orgId/admins/:userId', authenticate, async (req, res) => {
  const { orgId, userId } = req.params;
  const { display_name, wallet_address, status } = req.body;

  try {
    // Kiểm tra quyền owner
    const orgCheck = await pool.request()
      .input('org_id', sql.Int, orgId)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM dbo.organizations WHERE id = @org_id AND owner_id = @user_id');

    if (orgCheck.recordset.length === 0) {
      return res.status(403).json({ error: 'Không có quyền' });
    }

    // Cập nhật admin
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('org_id', sql.Int, orgId)
      .input('display_name', sql.NVarChar, display_name)
      .input('wallet_address', sql.NVarChar, wallet_address || null)
      .input('status', sql.NVarChar, status)
      .query(`
        UPDATE dbo.users
        SET display_name = @display_name,
            wallet_address = @wallet_address,
            status = @status,
            updated_at = SYSUTCDATETIME()
        WHERE id = @user_id AND org_id = @org_id AND role = 'admin_org'
      `);

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (error) {
    console.error('PUT /organizations/:orgId/admins error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Xóa Admin Khoa
router.delete('/:orgId/admins/:userId', authenticate, async (req, res) => {
  const { orgId, userId } = req.params;

  try {
    // Kiểm tra quyền owner
    const orgCheck = await pool.request()
      .input('org_id', sql.Int, orgId)
      .input('user_id', sql.Int, req.user.id)
      .query('SELECT id FROM dbo.organizations WHERE id = @org_id AND owner_id = @user_id');

    if (orgCheck.recordset.length === 0) {
      return res.status(403).json({ error: 'Không có quyền' });
    }

    // Xóa admin
    await pool.request()
      .input('user_id', sql.Int, userId)
      .input('org_id', sql.Int, orgId)
      .query('DELETE FROM dbo.users WHERE id = @user_id AND org_id = @org_id AND role = \'admin_org\'');

    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    console.error('DELETE /organizations/:orgId/admins error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;