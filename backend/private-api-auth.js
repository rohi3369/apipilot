// Private API authentication middleware
const privateApiAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];
  
  // Support both Bearer token and API key methods
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (validatePrivateApiToken(token)) {
      req.apiClient = { type: 'bearer', token };
      return next();
    }
  }
  
  if (apiKey && validateApiKey(apiKey)) {
    req.apiClient = { type: 'api_key', key: apiKey };
    return next();
  }
  
  res.status(401).json({ 
    error: 'Unauthorized - Valid API key or Bearer token required' 
  });
};

// Validate private API tokens (implement your logic)
const validatePrivateApiToken = (token) => {
  const validTokens = (process.env.PRIVATE_API_TOKENS || '').split(',');
  return validTokens.includes(token);
};

// Validate API keys
const validateApiKey = (apiKey) => {
  const validApiKeys = (process.env.PRIVATE_API_KEYS || '').split(',');
  return validApiKeys.includes(apiKey);
};

// Rate limiting for private APIs (optional - will be used if available)
let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (error) {
  console.log('express-rate-limit not available, rate limiting disabled');
}

const privateApiRateLimit = rateLimit ? rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP' },
  standardHeaders: true,
  legacyHeaders: false,
}) : (req, res, next) => next(); // Pass-through if rate limiting not available

module.exports = { privateApiAuth, privateApiRateLimit };
