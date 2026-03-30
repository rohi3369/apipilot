const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mockPrivateApis = require("./mock-private-apis");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret";

// CORS configuration - most permissive for development
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost",
      "http://localhost:80", 
      "http://127.0.0.1", 
      "http://127.0.0.1:80",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ];
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
  exposedHeaders: ["Authorization"],
  preflightContinue: false
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin || 'No origin'} - ${new Date().toISOString()}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  console.log('Health check accessed');
  res.json({ 
    status: "ok", 
    message: "ApiPilot is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Test endpoint
app.get("/test", (req, res) => {
  console.log('Test endpoint accessed');
  res.json({ 
    status: "ok", 
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: req.headers,
    query: req.query
  });
});

// Simple token generation
function generateToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

// Login endpoint
app.post("/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`Login attempt: ${username} from ${req.ip}`);
    
    // Basic validation
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      console.log('Invalid username length');
      return res.status(400).json({ error: "Username must be between 3 and 50 characters" });
    }
    
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      console.log('Invalid password length');
      return res.status(400).json({ error: "Password must be between 6 and 128 characters" });
    }
    
    // Simple users database
    const users = {
      admin: { password: "admin123", role: "admin" },
      user: { password: "user123", role: "user" }
    };
    
    const user = users[username];
    
    if (!user || user.password !== password) {
      console.log(`Login failed for: ${username}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const token = generateToken({ username, role: user.role });
    console.log(`Login successful for: ${username}`);
    
    res.json({
      message: "Login successful",
      token,
      user: { username, role: user.role },
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Login failed due to server error" });
  }
});

// Simple authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Invalid token:', error.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// Protected endpoint - get user info
app.get("/auth/me", authenticateToken, (req, res) => {
  console.log(`User info requested for: ${req.user.username}`);
  res.json({ 
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Token refresh endpoint
app.post("/auth/refresh", authenticateToken, (req, res) => {
  try {
    const newToken = generateToken({ username: req.user.username, role: req.user.role });
    console.log(`Token refreshed for: ${req.user.username}`);
    res.json({ 
      token: newToken,
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

// Simple proxy endpoint
app.post("/proxy", authenticateToken, async (req, res) => {
  try {
    const { url, method = "GET", headers = {}, params = [], bodyType, body } = req.body;
    
    console.log(`Proxy request: ${method} ${url} by ${req.user.username}`);
    
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: "Invalid URL format" });
    }
    
    const response = await fetch(url, { 
      method,
      headers: {
        'User-Agent': 'ApiPilot-Proxy/1.0',
        ...headers
      },
      body: (body && ['POST', 'PUT', 'PATCH'].includes(method)) ? JSON.stringify(body) : undefined,
      timeout: 30000
    });
    
    const responseHeaders = {};
    response.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });
    
    let responseData;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else if (contentType.includes('text/html')) {
      const text = await response.text();
      responseData = {
        message: "HTML response received",
        contentType,
        preview: text.substring(0, 500),
        isHtml: true,
        fullText: text
      };
    } else {
      responseData = await response.text();
    }
    
    console.log(`Proxy response: ${response.status} for ${method} ${url}`);
    
    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
      url: url,
      method: method,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ 
      error: "Proxy request failed",
      details: error.message,
      url: req.body.url,
      method: req.body.method || 'GET'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  console.error('Stack:', err.stack);
  
  if (!res.headersSent) {
    res.status(500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: "Route not found",
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}, starting graceful shutdown`);
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Mock Private API routes
app.use('/mock', mockPrivateApis);

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ApiPilot backend server running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/auth/login`);
  console.log(`📡 Proxy endpoint: http://localhost:${PORT}/proxy`);
  console.log(`🔒 Mock Private APIs: http://localhost:${PORT}/mock/health`);
  console.log(`🌐 CORS enabled for: http://localhost, http://localhost:80, http://127.0.0.1, http://127.0.0.1:80`);
  console.log(`✅ Server is ready for connections!`);
});
