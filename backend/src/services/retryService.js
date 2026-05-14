// Retry a function with exponential backoff
// Example: wait 1s, then 2s, then 4s between retries
const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,    // 1 second
    maxDelay = 10000,    // 10 seconds max
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on certain errors
      if (error.status === 401) throw error; // Auth error — don't retry
      if (error.status === 400) throw error; // Bad request — don't retry
      if (attempt === maxRetries) break;     // Last attempt — give up

      // Calculate delay with exponential backoff
      // Attempt 0: 1s, Attempt 1: 2s, Attempt 2: 4s
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Add some randomness to prevent all retries happening at same time
      const jitter = Math.random() * 500;
      const totalDelay = delay + jitter;

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(totalDelay)}ms`);

      if (onRetry) onRetry(attempt + 1, error);

      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
};

module.exports = { withRetry };