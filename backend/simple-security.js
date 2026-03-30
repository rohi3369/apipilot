// Simple security middleware without external dependencies
const rateLimitStore = new Map();

// Simple rate limiting
const simpleRateLimit = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 100;
  
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (rateLimitStore.has(key)) {
      const requests = rateLimitStore.get(key).filter(time => time > windowStart);
      rateLimitStore.set(key, requests);
    } else {
      rateLimitStore.set(key, []);
    }
    
    const requests = rateLimitStore.get(key);
    
    if (requests.length >= max) {
      return res.status(429).json({
        error: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    requests.push(now);
    next();
  };
};

// Simple input validation
const validateInput = (req, res, next) => {
  const { username, password } = req.body;
  
  if (req.path === '/auth/login') {
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }
    
    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      return res.status(400).json({
        error: 'Username must be between 3 and 50 characters'
      });
    }
    
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return res.status(400).json({
        error: 'Password must be between 6 and 128 characters'
      });
    }
  }
  
  next();
};

// Simple logging
const simpleLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  
  next();
};

// Simple error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (!res.headersSent) {
    res.status(500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message
    });
  }
};

module.exports = {
  simpleRateLimit,
  validateInput,
  simpleLogger,
  errorHandler
};
