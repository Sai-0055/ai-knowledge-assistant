const chatService = require('../services/chatService');
const historyService = require('../services/historyService');
const cacheService = require('../services/cacheService');

// Get chat history
const getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await historyService.getChatHistory(userId);
    res.json({ messages: history });
  } catch (error) {
    console.error('History error:', error.message);
    res.status(500).json({ error: 'Could not load chat history' });
  }
};

// Clear chat history
const clearHistory = async (req, res) => {
  try {
    await historyService.clearHistory(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Could not clear history' });
  }
};

// Send chat message with caching + streaming + save to DB
const chat = async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Save user message to database
    await historyService.saveMessage(userId, 'user', message);

    // Check Redis cache first
    const cachedReply = await cacheService.getCached(message);

    if (cachedReply) {
      // Cache HIT — return saved response instantly, no OpenAI call
      await historyService.saveMessage(userId, 'bot', cachedReply);
      return res.json({
        botReply: cachedReply,
        fromCache: true
      });
    }

    // Cache MISS — call OpenAI with streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Tell frontend this is a fresh response
    res.write(`data: ${JSON.stringify({ fromCache: false })}\n\n`);

    let fullReply = '';

    await chatService.getStreamingReply(
      message,
      (chunk) => {
        fullReply += chunk;
        res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      async () => {
        // Save to database and cache when done
        await historyService.saveMessage(userId, 'bot', fullReply);
        await cacheService.setCached(message, fullReply);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      },
      (error) => {
        console.error('Streaming error:', error.message);
        res.write(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`);
        res.end();
      }
    );
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { chat, getHistory, clearHistory };