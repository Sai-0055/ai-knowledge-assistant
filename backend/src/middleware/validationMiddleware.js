const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => err.msg)
    });
  }
  next();
};

// Validation rules for login
const validateLogin = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 3 }).withMessage('Password must be at least 3 characters'),

  handleValidationErrors
];

// Validation rules for chat message
const validateMessage = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),

  handleValidationErrors
];

module.exports = { validateLogin, validateMessage };