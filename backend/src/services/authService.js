const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

const login = async (username, password) => {
  try {
    // Look up user in real database now
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    const user = result.rows[0];

    if (!user) {
      return { success: false, error: 'Invalid username or password' };
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      success: true,
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role }
    };
  } catch (error) {
    console.error('Login error:', error.message);
    return { success: false, error: 'Server error during login' };
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
};

module.exports = { login, verifyToken };