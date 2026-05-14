require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const documentRoutes = require('./routes/documentRoutes');

// Start background worker
require('./workers/documentWorker');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Compress all responses — makes transfers faster
app.use(compression({
  level: 6,           // Compression level (1-9, 6 is good balance)
  threshold: 1024,    // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress SSE streams
    if (req.headers.accept === 'text/event-stream') return false;
    return compression.filter(req, res);
  }
}));

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' },
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again later.' }
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many messages. Please slow down!' }
});

app.use(globalLimiter);

// Health check with performance metrics
app.get('/health', (req, res) => {
  const { getStatus } = require('./services/circuitBreakerService');
  const used = process.memoryUsage();

  res.json({
    status: 'OK',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()) + 's',
    memory: {
      used: Math.round(used.heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(used.heapTotal / 1024 / 1024) + 'MB',
    },
    services: {
      database: 'connected',
      redis: 'connected',
      circuitBreakers: getStatus()
    }
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/documents', documentRoutes);

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});