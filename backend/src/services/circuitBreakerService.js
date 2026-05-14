const CircuitBreaker = require('opossum');

// Circuit breaker options
const defaultOptions = {
  timeout: 10000,          // 10 seconds — if function takes longer, it fails
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000,     // Try again after 30 seconds
  volumeThreshold: 3,      // Minimum requests before circuit can open
};

// Track all breakers
const breakers = new Map();

// Create a circuit breaker for any async function
const createBreaker = (name, fn, options = {}) => {
  if (breakers.has(name)) {
    return breakers.get(name);
  }

  const breaker = new CircuitBreaker(fn, {
    ...defaultOptions,
    ...options,
    name
  });

  // Log state changes
  breaker.on('open', () => {
    console.warn(`🔴 Circuit OPEN: ${name} — requests will fail fast`);
  });

  breaker.on('halfOpen', () => {
    console.log(`🟡 Circuit HALF-OPEN: ${name} — testing if service recovered`);
  });

  breaker.on('close', () => {
    console.log(`🟢 Circuit CLOSED: ${name} — service recovered`);
  });

  breaker.on('fallback', () => {
    console.log(`🔄 Fallback triggered for: ${name}`);
  });

  breakers.set(name, breaker);
  return breaker;
};

// Get status of all circuit breakers
const getStatus = () => {
  const status = {};
  for (const [name, breaker] of breakers) {
    status[name] = {
      state: breaker.opened ? 'open' : breaker.halfOpen ? 'half-open' : 'closed',
      stats: {
        successes: breaker.stats.successes,
        failures: breaker.stats.failures,
        timeouts: breaker.stats.timeouts,
        rejects: breaker.stats.rejects,
      }
    };
  }
  return status;
};

module.exports = { createBreaker, getStatus };