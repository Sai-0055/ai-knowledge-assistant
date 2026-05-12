const chatService = require('../services/chatService');
const historyService = require('../services/historyService');
const cacheService = require('../services/cacheService');
const documentService = require('../services/documentService');

// Get chat history
const getHistory = async (req, res) => {
  try {
    const history = await historyService.getChatHistory(req.user.id);
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

// Get cache stats
const getCacheStats = async (req, res) => {
  const stats = await cacheService.getStats();
  res.json(stats);
};

// Main chat handler with RAG
const chat = async (req, res) => {
  const { message } = req.body;
  const userId = req.user.id;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Save user message to database
    await historyService.saveMessage(userId, 'user', message);

    // Check cache first
    const cachedReply = await cacheService.getCached(message);
    if (cachedReply) {
      await historyService.saveMessage(userId, 'bot', cachedReply);
      return res.json({ botReply: cachedReply, fromCache: true });
    }

    // Set SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullReply = '';
    let usingRAG = false;

    // Search for relevant documents
    try {
      const docStats = documentService.getDocumentStats();
      if (docStats.totalChunks > 0) {
        const relevantDocs = await documentService.searchDocuments(message, 3);
        if (relevantDocs.length > 0) {
          usingRAG = true;
          console.log(`RAG: Found ${relevantDocs.length} relevant chunks for query`);

          // Tell frontend we're using RAG
          res.write(`data: ${JSON.stringify({ rag: true, sources: relevantDocs.map(d => d.metadata.fileName) })}\n\n`);

          await chatService.getRAGStreamingReply(
            message,
            relevantDocs,
            (chunk) => {
              fullReply += chunk;
              res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
            },
            async () => {
              await historyService.saveMessage(userId, 'bot', fullReply);
              await cacheService.setCached(message, fullReply);
              res.write(`data: ${JSON.stringify({ done: true, usingRAG: true })}\n\n`);
              res.end();
            },
            (error) => {
              console.error('RAG streaming error:', error.message);
              res.write(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`);
              res.end();
            }
          );
          return;
        }
      }
    } catch (ragError) {
      console.error('RAG search error:', ragError.message);
    }

    // No documents found — use regular streaming
    if (!usingRAG) {
      console.log('No relevant documents found — using regular chat');
      await chatService.getStreamingReply(
        message,
        (chunk) => {
          fullReply += chunk;
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        },
        async () => {
          await historyService.saveMessage(userId, 'bot', fullReply);
          await cacheService.setCached(message, fullReply);
          res.write(`data: ${JSON.stringify({ done: true, usingRAG: false })}\n\n`);
          res.end();
        },
        (error) => {
          console.error('Streaming error:', error.message);
          res.write(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`);
          res.end();
        }
      );
    }
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

module.exports = { chat, getHistory, clearHistory, getCacheStats };