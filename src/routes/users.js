const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const db = require('../services/db');

// Lấy thông tin user hiện tại
router.get('/me', authenticate, async (req, res) => {
  res.json(req.user);
});

// Admin: Lấy danh sách users
router.get('/', authenticate, async (req, res) => {
  try {
    if (!['admin_root', 'org'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Cập nhật role user
router.put('/:id/role', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin_root') {
      return res.status(403).json({ error: 'Only admin_root can update roles' });
    }

    const { role } = req.body;
    const userId = req.params.id;

    await db.updateUserRole(userId, role);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cập nhật wallet address
router.put('/wallet', authenticate, async (req, res) => {
  try {
    const { wallet_address } = req.body;
    const userId = req.user.id;

    await db.updateUserWallet(userId, wallet_address);
    
    // Cập nhật cache
    const token = req.headers.authorization.split(' ')[1];
    const cachedUser = userCache.get(token);
    if (cachedUser) {
      cachedUser.wallet_address = wallet_address;
      userCache.set(token, cachedUser);
    }

    res.json({ 
      success: true,
      wallet_address 
    });
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;