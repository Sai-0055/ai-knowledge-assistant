const Bull = require('bull');

// Document processing queue
// Uses Redis (which we already have running)
const documentQueue = new Bull('document-processing', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  }
});

// Log queue events
documentQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed: ${job.data.fileName}`);
});

documentQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed: ${err.message}`);
});

documentQueue.on('active', (job) => {
  console.log(`⚙️  Processing job ${job.id}: ${job.data.fileName}`);
});

module.exports = { documentQueue };