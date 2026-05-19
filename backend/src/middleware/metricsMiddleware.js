const { recordRequest } = require('../config/metrics');
const logger = require('../config/logger');

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // When response finishes, record the metrics
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const endpoint = req.route?.path || req.path;

    recordRequest(endpoint, req.method, res.statusCode, responseTime);

    // Log slow requests (over 2 seconds)
    if (responseTime > 2000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
    }

    // Log errors
    if (res.statusCode >= 400) {
      logger.error(`Error response: ${req.method} ${req.path} ${res.statusCode} ${responseTime}ms`);
    } else {
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${responseTime}ms`);
    }
  });

  next();
};

module.exports = metricsMiddleware;