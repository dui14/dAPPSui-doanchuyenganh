const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../services/db');

// Lấy danh sách tổ chức
router.get('/', authenticate, async (req, res) => {
  try {
    const orgs = await db.getOrganizations();
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tạo tổ chức mới
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'org') {
      return res.status(403).json({ error: 'Only org role can create organization' });
    }

    const { org_name, org_email } = req.body;
    const newOrg = await db.createOrganization({
      org_name,
      org_email,
      owner_id: req.user.id
    });

    res.status(201).json(newOrg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin root duyệt tổ chức
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin_root') {
      return res.status(403).json({ error: 'Only admin_root can approve organizations' });
    }

    await db.approveOrganization(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;