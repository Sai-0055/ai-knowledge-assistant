const redis = require('../config/redis');
const crypto = require('crypto');

// Cache responses for 1 hour
const CACHE_TTL = 60 * 60;

// Turn prompt into a unique key
const hashPrompt = (prompt) => {
  return 'chat:' + crypto
    .createHash('md5')
    .update(prompt.toLowerCase().trim())
    .digest('hex');
};

// Get cached response
const getCached = async (prompt) => {
  try {
    const key = hashPrompt(prompt);
    const cached = await redis.get(key);
    if (cached) {
      console.log('Cache HIT:', prompt.substring(0, 40));
      return cached;
    }
    console.log('Cache MISS:', prompt.substring(0, 40));
    return null;
  } catch (err) {
    console.error('Cache get error:', err.message);
    return null;
  }
};

// Save response to Redis
const setCached = async (prompt, response) => {
  try {
    const key = hashPrompt(prompt);
    // setex = set with expiry (TTL in seconds)
    await redis.setex(key, CACHE_TTL, response);
    console.log('Cached response for:', prompt.substring(0, 40));
  } catch (err) {
    console.error('Cache set error:', err.message);
  }
};

// Clear all chat cache
const clearCache = async () => {
  try {
    const keys = await redis.keys('chat:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cleared ${keys.length} cached entries`);
    }
  } catch (err) {
    console.error('Cache clear error:', err.message);
  }
};

// Get cache stats
const getStats = async () => {
  try {
    const keys = await redis.keys('chat:*');
    return {
      totalCachedResponses: keys.length,
      message: keys.length === 0
        ? 'No cached responses yet'
        : `${keys.length} responses cached in Redis`
    };
  } catch (err) {
    return { error: err.message };
  }
};

module.exports = { getCached, setCached, clearCache, getStats };