const sql = require('mssql');
const pool = require('../config/db');


const db = {
  async getUserByEmail(email) {
    try {
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query(`
          SELECT id, email, display_name, wallet_address, role, org_id, status 
          FROM users 
          WHERE email = @email AND status = 'active'
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('DB Error:', error);
      throw error;
    }
  },

  async createUser(userData) {
    try {
      const result = await pool.request()
        .input('email', sql.NVarChar, userData.email)
        .input('display_name', sql.NVarChar, userData.display_name)
        .input('wallet_address', sql.NVarChar, userData.wallet_address)
        .input('role', sql.NVarChar, userData.role)
        .query(`
          INSERT INTO users (email, display_name, wallet_address, role)
          OUTPUT INSERTED.*
          VALUES (@email, @display_name, @wallet_address, @role)
        `);
      return result.recordset[0];
    } catch (error) {
      console.error('DB Error:', error);
      throw error;
    }
  },
  

  // Lấy danh sách tất cả users đang active
  async getAllUsers() {
    try {
      const result = await pool.request()
        .query(`
          SELECT id, email, display_name, wallet_address, role, org_id, status 
          FROM users 
          WHERE status = 'active'
          ORDER BY created_at DESC
        `);
      return result.recordset;
    } catch (error) {
      console.error('DB Error:', error);
      throw error;
    }
  },

  // Cập nhật role của user
  async updateUserRole(userId, role) {
    try {
      await pool.request()
        .input('id', sql.Int, userId)
        .input('role', sql.NVarChar, role)
        .query(`
          UPDATE users 
          SET role = @role,
              updated_at = GETUTCDATE()
          WHERE id = @id AND status = 'active'
        `);
    } catch (error) {
      console.error('DB Error:', error);
      throw error;
    }
  },

  // Cập nhật wallet address
  async updateUserWallet(userId, walletAddress) {
    try {
      await pool.request()
        .input('id', sql.Int, userId)
        .input('wallet', sql.NVarChar, walletAddress)
        .query(`
          UPDATE users 
          SET wallet_address = @wallet,
              updated_at = GETUTCDATE()
          WHERE id = @id AND status = 'active'
        `);
    } catch (error) {
      console.error('DB Error:', error);
      throw error;
    }
  },

  // Vô hiệu hóa user
  async deactivateUser(userId) {
    try {
      await pool.request()
        .input('id', sql.Int, userId)
        .query(`
          UPDATE users 
          SET status = 'suspended',
              updated_at = GETUTCDATE()
          WHERE id = @id
        `);
    } catch (error) {
      console.error('DB Error:', error); 
      throw error;
    }
  }
};

module.exports = db;