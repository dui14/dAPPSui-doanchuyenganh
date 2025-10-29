const { verifyToken } = require('../services/jwt');
const db = require('../services/db');
const { userCache } = require('../services/cache');

async function authenticate(req, res, next) {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token required',
        details: 'Authorization header missing or invalid format'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 20) + '...'); // Log một phần token

    // Kiểm tra cache
    const cachedUser = userCache.get(token);
    if (cachedUser) {
      req.user = cachedUser;
      return next();
    }

    // Verify JWT token từ Dynamic
    const decoded = await verifyToken(token);
    console.log('Decoded token:', decoded); 

    if (!decoded.email) {
      return res.status(401).json({ 
        error: 'Invalid token',
        details: 'No email in token'
      });
    }
    
    // Kiểm tra email từ token
    if (!decoded.email) {
      return res.status(401).json({ error: 'Invalid token - no email found' });
    }

    // Tìm user trong database
    let user = await db.getUserByEmail(decoded.email);

    // Nếu user chưa tồn tại, tạo mới với role 'user'
    if (!user) {
      const newUser = {
        email: decoded.email,
        display_name: decoded.name || decoded.email.split('@')[0],
        wallet_address: decoded.walletAddress || null,
        role: 'user' // Mặc định role là user
      };

      user = await db.createUser(newUser);
      console.log('Created new user:', user);
    }

    // Cache user data
    userCache.set(token, user);
    req.user = user;
    next();
  }  catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
}

module.exports = { authenticate };