// middleware/auth.js
const { verifyToken } = require('../services/jwt');
const db = require('../services/db');
const { userCache } = require('../services/cache');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token required',
        details: 'Authorization header missing or invalid format'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received (first 20):', token.substring(0, 20) + '...');

    // Kiểm tra cache
    const cachedUser = userCache.get(token);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    // Verify JWT từ Dynamic Labs
    const decoded = await verifyToken(token);
    if (!decoded.email) {
      return res.status(401).json({ error: 'Invalid token - no email' });
    }

    // Lấy wallet address từ verified_credentials
    let walletAddress = null;
    if (decoded.verified_credentials) {
      const suiWallet = decoded.verified_credentials.find(
        cred => cred.chain === 'sui' && cred.format === 'blockchain'
      );
      if (suiWallet) walletAddress = suiWallet.address;
    }

    // Tìm user trong DB
    let user = await db.getUserByEmail(decoded.email);

    // Nếu chưa có → tạo mới
    if (!user) {
      const newUser = {
        email: decoded.email,
        display_name: decoded.name || decoded.email.split('@')[0],
        wallet_address: walletAddress || null,
        role: 'user' // Chỉ gán khi tạo mới
      };
      user = await db.createUser(newUser);
      console.log('Created new user:', user.id);
    } else {
      // Cập nhật wallet nếu thay đổi
      if (walletAddress && user.wallet_address !== walletAddress) {
        await db.updateUserWallet(user.id, walletAddress);
        user.wallet_address = walletAddress;
      }
      // → KHÔNG GÁN role = 'user' ở đây nữa!
    }

    // Cache user
    userCache.set(token, user);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
}

module.exports = { authenticate };