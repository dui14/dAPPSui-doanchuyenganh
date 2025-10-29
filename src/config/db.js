const sql = require('mssql');

// Kiểm tra biến môi trường
if (!process.env.DB_SERVER || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error('Missing database configuration');
  process.exit(1);
}

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER.toString(),
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Tạo pool connection
const pool = new sql.ConnectionPool(config);

// Hàm kết nối database
const connectDB = async () => {
  try {
    console.log('Connecting to database...');
    console.log('Server:', config.server);
    console.log('Database:', config.database);
    
    await pool.connect();
    console.log('Connected to database successfully!');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
};

// Kết nối khi khởi động
connectDB();

// Handle pool errors
pool.on('error', err => {
  console.error('Database pool error:', err);
});

module.exports = pool;