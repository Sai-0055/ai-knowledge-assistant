const redis = require('../config/redis');
const crypto = require('crypto');

// How long to keep cached responses (in seconds)
const CACHE_TTL = 60 * 60; // 1 hour

// Turn a prompt into a short unique key
const hashPrompt = (prompt) => {
  return crypto
    .createHash('md5')
    .update(prompt.toLowerCase().trim())
    .digest('hex');
};

// Get cached response for a prompt
const getCached = async (prompt) => {
  try {
    const key = `chat:${hashPrompt(prompt)}`;
    const cached = await redis.get(key);
    if (cached) {
      console.log('Cache HIT for:', prompt.substring(0, 40));
      return cached;
    }
    console.log('Cache MISS for:', prompt.substring(0, 40));
    return null;
  } catch (err) {
    console.error('Cache get error:', err.message);
    return null; // If Redis fails, just continue without cache
  }
};

// Save a response to cache
const setCached = async (prompt, response) => {
  try {
    const key = `chat:${hashPrompt(prompt)}`;
    await redis.setex(key, CACHE_TTL, response);
    console.log('Cached response for:', prompt.substring(0, 40));
  } catch (err) {
    console.error('Cache set error:', err.message);
    // If Redis fails, just continue — not critical
  }
};

// Clear all cached responses
const clearCache = async () => {
  try {
    const keys = await redis.keys('chat:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cleared ${keys.length} cached responses`);
    }
  } catch (err) {
    console.error('Cache clear error:', err.message);
  }
};

module.exports = { getCached, setCached, clearCache };