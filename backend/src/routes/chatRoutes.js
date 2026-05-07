const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, chatController.chat);
router.get('/history', authMiddleware, chatController.getHistory);
router.delete('/history', authMiddleware, chatController.clearHistory);

module.exports = router;