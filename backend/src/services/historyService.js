const messageRepository = require('../repositories/messageRepository');

const saveMessage = async (userId, role, content) => {
  return await messageRepository.saveMessage(userId, role, content);
};

const getChatHistory = async (userId, limit = 50) => {
  // Only fetch last 50 messages — no need to load entire history
  const messages = await messageRepository.getMessagesByUserId(userId, limit);
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    text: msg.content,
    time: new Date(msg.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }));
};

const clearHistory = async (userId) => {
  return await messageRepository.clearMessagesByUserId(userId);
};

module.exports = { saveMessage, getChatHistory, clearHistory };