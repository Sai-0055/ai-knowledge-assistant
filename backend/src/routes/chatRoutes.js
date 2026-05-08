const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateMessage } = require('../middleware/validationMiddleware');

router.post('/', authMiddleware, validateMessage, chatController.chat);
router.get('/history', authMiddleware, chatController.getHistory);
router.delete('/history', authMiddleware, chatController.clearHistory);
router.get('/cache/stats', authMiddleware, chatController.getCacheStats);

module.exports = router;