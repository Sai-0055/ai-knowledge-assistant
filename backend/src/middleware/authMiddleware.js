const authService = require('../services/authService');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      error: 'Access denied. No token provided.'
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. Invalid token format.'
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Access denied. Token is empty.'
    });
  }

  const decoded = authService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      error: 'Access denied. Invalid or expired token. Please login again.'
    });
  }

  req.user = decoded;
  next();
};

module.exports = authMiddleware;