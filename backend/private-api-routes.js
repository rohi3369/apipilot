// Example private API routes with authentication
const express = require('express');
const { privateApiAuth, privateApiRateLimit } = require('./private-api-auth');
const { authenticateJWT } = require('./auth-middleware');

const router = express.Router();

// Apply rate limiting to all private API routes
router.use(privateApiRateLimit);

// Private API endpoints - require either JWT or API key authentication
router.get('/private-data', privateApiAuth, (req, res) => {
  res.json({
    message: 'This is private data',
    timestamp: new Date().toISOString(),
    client: req.apiClient
  });
});

router.post('/private-action', privateApiAuth, (req, res) => {
  const { action, data } = req.body;
  
  // Process private action
  res.json({
    success: true,
    message: `Private action "${action}" executed successfully`,
    result: data,
    timestamp: new Date().toISOString()
  });
});

// Admin-only private endpoints - require JWT + admin role
router.get('/admin-only', authenticateJWT, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  res.json({
    message: 'Admin-only data',
    adminUser: req.user,
    timestamp: new Date().toISOString()
  });
});

// Protected endpoint that allows both auth methods but logs differently
router.get('/mixed-auth', (req, res) => {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];
  
  let authMethod = 'none';
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authMethod = 'jwt';
  } else if (apiKey) {
    authMethod = 'api_key';
  }
  
  res.json({
    message: 'Mixed authentication endpoint',
    authMethod,
    timestamp: new Date().toISOString()
  });
});

// Health check for private APIs (no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'private-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;
