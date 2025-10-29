const NodeCache = require('node-cache');

// Cache với thời gian sống 1 giờ
const userCache = new NodeCache({ 
  stdTTL: 3600, // seconds
  checkperiod: 120 // kiểm tra và xóa cache hết hạn mỗi 120s
});

module.exports = {
  userCache
};