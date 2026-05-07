const pool = require('../config/database');

// Save a single message to the database
const saveMessage = async (userId, role, content) => {
  const query = `
    INSERT INTO messages (user_id, role, content)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const result = await pool.query(query, [userId, role, content]);
  return result.rows[0];
};

// Get all messages for a user ordered by time
const getMessagesByUserId = async (userId) => {
  const query = `
    SELECT id, role, content, created_at
    FROM messages
    WHERE user_id = $1
    ORDER BY created_at ASC
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

// Delete all messages for a user
const clearMessagesByUserId = async (userId) => {
  const query = `DELETE FROM messages WHERE user_id = $1`;
  await pool.query(query, [userId]);
};

module.exports = { saveMessage, getMessagesByUserId, clearMessagesByUserId };