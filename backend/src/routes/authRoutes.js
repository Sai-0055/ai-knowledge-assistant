const express = require('express');
const router = express.Router();
const { login, verify } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateLogin } = require('../middleware/validationMiddleware');

router.post('/login', validateLogin, login);
router.get('/verify', authMiddleware, verify);

module.exports = router;