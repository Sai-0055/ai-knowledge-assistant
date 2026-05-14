const pool = require('../config/database');

const saveMessage = async (userId, role, content) => {
  const query = `
    INSERT INTO messages (user_id, role, content)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await pool.query(query, [userId, role, content]);
  return result.rows[0];
};

// Add LIMIT and INDEX hint for faster queries
const getMessagesByUserId = async (userId, limit = 50) => {
  const query = `
    SELECT id, role, content, created_at
    FROM messages
    WHERE user_id = $1
    ORDER BY created_at ASC
    LIMIT $2
  `;
  const result = await pool.query(query, [userId, limit]);
  return result.rows;
};

const clearMessagesByUserId = async (userId) => {
  const query = `DELETE FROM messages WHERE user_id = $1`;
  await pool.query(query, [userId]);
};

module.exports = { saveMessage, getMessagesByUserId, clearMessagesByUserId };