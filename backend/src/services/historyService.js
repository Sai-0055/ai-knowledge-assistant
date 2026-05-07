const messageRepository = require('../repositories/messageRepository');

const saveMessage = async (userId, role, content) => {
  return await messageRepository.saveMessage(userId, role, content);
};

const getChatHistory = async (userId) => {
  const messages = await messageRepository.getMessagesByUserId(userId);
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