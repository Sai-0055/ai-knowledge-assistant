// In-memory metrics store
// Tracks response times, error rates, request counts
const metrics = {
  requests: {
    total: 0,
    success: 0,
    errors: 0,
  },
  responseTimes: [], // Store last 1000 response times
  endpoints: {},     // Per-endpoint metrics
  startTime: Date.now(),
};

// Record a request
const recordRequest = (endpoint, method, statusCode, responseTime) => {
  metrics.requests.total++;

  if (statusCode >= 400) {
    metrics.requests.errors++;
  } else {
    metrics.requests.success++;
  }

  // Store response time (keep last 1000)
  metrics.responseTimes.push(responseTime);
  if (metrics.responseTimes.length > 1000) {
    metrics.responseTimes.shift();
  }

  // Per-endpoint tracking
  const key = `${method} ${endpoint}`;
  if (!metrics.endpoints[key]) {
    metrics.endpoints[key] = {
      count: 0,
      errors: 0,
      totalTime: 0,
      times: []
    };
  }

  metrics.endpoints[key].count++;
  metrics.endpoints[key].totalTime += responseTime;
  metrics.endpoints[key].times.push(responseTime);

  if (statusCode >= 400) {
    metrics.endpoints[key].errors++;
  }

  // Keep only last 100 times per endpoint
  if (metrics.endpoints[key].times.length > 100) {
    metrics.endpoints[key].times.shift();
  }
};

// Calculate percentile from array of numbers
const percentile = (arr, p) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)]);
};

// Get full metrics summary
const getMetrics = () => {
  const times = metrics.responseTimes;
  const uptime = Math.round((Date.now() - metrics.startTime) / 1000);

  // Calculate endpoint summaries
  const endpointSummary = {};
  for (const [key, data] of Object.entries(metrics.endpoints)) {
    endpointSummary[key] = {
      count: data.count,
      errors: data.errors,
      errorRate: data.count > 0
        ? Math.round((data.errors / data.count) * 100) + '%'
        : '0%',
      avgTime: data.count > 0
        ? Math.round(data.totalTime / data.count) + 'ms'
        : '0ms',
      p95: percentile(data.times, 95) + 'ms'
    };
  }

  return {
    uptime: uptime + 's',
    requests: {
      total: metrics.requests.total,
      success: metrics.requests.success,
      errors: metrics.requests.errors,
      errorRate: metrics.requests.total > 0
        ? Math.round((metrics.requests.errors / metrics.requests.total) * 100) + '%'
        : '0%'
    },
    responseTimes: {
      p50: percentile(times, 50) + 'ms',
      p95: percentile(times, 95) + 'ms',
      p99: percentile(times, 99) + 'ms',
      avg: times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) + 'ms'
        : '0ms'
    },
    endpoints: endpointSummary
  };
};

module.exports = { recordRequest, getMetrics };