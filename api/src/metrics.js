const metrics = {
  requests: 0,
  errors4xx: 0,
  errors5xx: 0,

  productsViewed: 0,
  productsCreated: 0,

  responseTimes: []
};

function recordRequest(statusCode, duration) {
  metrics.requests++;

  if (statusCode >= 400 && statusCode < 500) {
    metrics.errors4xx++;
  }

  if (statusCode >= 500) {
    metrics.errors5xx++;
  }

  metrics.responseTimes.push(duration);

  if (metrics.responseTimes.length > 100) {
    metrics.responseTimes.shift();
  }
}

function averageResponseTime() {
  if (metrics.responseTimes.length === 0) return 0;

  const total = metrics.responseTimes.reduce((a, b) => a + b, 0);

  return Math.round(total / metrics.responseTimes.length);
}

function p95ResponseTime() {
  if (metrics.responseTimes.length === 0) return 0;

  const sorted = [...metrics.responseTimes].sort((a, b) => a - b);

  const index = Math.floor(sorted.length * 0.95);

  return sorted[index];
}

module.exports = {
  metrics,
  recordRequest,
  averageResponseTime,
  p95ResponseTime
};