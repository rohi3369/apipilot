const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const FormData = require("form-data");
const AbortController = require("abort-controller");
const { generateToken, refreshToken } = require("./token-auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Basic Middleware ───────────────────────────────────────────────
app.use(cors({ 
  origin: ["http://localhost", "http://localhost:80", "http://127.0.0.1", "http://127.0.0.1:80"], 
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Simple request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  next();
});

// ─── Health Check ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "ApiPilot proxy is running" });
});

// ─── Simple Test Endpoint ───────────────────────────────────
app.get("/test", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Test endpoint working",
    timestamp: new Date().toISOString(),
    headers: req.headers,
    query: req.query
  });
});

// ─── Authentication Routes ────────────────────────────────────
app.post("/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 Login attempt for user: ${username} from IP: ${req.ip}`);
    
    // Basic validation
    if (!username || !password) {
      console.log(`❌ Missing username or password`);
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
      console.log(`❌ Invalid username length`);
      return res.status(400).json({ error: "Username must be between 3 and 50 characters" });
    }
    
    if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
      console.log(`❌ Invalid password length`);
      return res.status(400).json({ error: "Password must be between 6 and 128 characters" });
    }
    
    // Simple authentication (in production, use hashed passwords in database)
    const users = {
      admin: { password: "admin123", role: "admin" },
      user: { password: "user123", role: "user" }
    };
    
    const user = users[username];
    
    if (!user || user.password !== password) {
      console.log(`❌ Login failed for user: ${username} from IP: ${req.ip}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const token = generateToken({ username, role: user.role });
    console.log(`✅ Login successful for user: ${username} from IP: ${req.ip}`);
    
    res.json({
      message: "Login successful",
      token,
      user: { username, role: user.role }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/auth/refresh", (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Simple token validation (you should use the same logic as in auth-middleware)
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret";
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const newToken = refreshToken(decoded);
      console.log(`🔄 Token refreshed for user: ${decoded.username}`);
      res.json({ token: newToken });
    } catch (error) {
      console.log(`❌ Token refresh failed: ${error.message}`);
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({ error: "Token refresh failed" });
  }
});

app.get("/auth/me", (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret";
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log(`👤 User info requested for: ${decoded.username}`);
      res.json({ user: decoded });
    } catch (error) {
      console.log(`❌ Invalid token for user info: ${error.message}`);
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (error) {
    console.error('❌ User info error:', error);
    res.status(500).json({ error: "Failed to get user info" });
  }
});

// ─── Proxy Route ──────────────────────────────────────────────
app.post("/proxy", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      console.log(`❌ No token provided for proxy request`);
      return res.status(401).json({ error: "Unauthorized - No token provided" });
    }

    // Verify token
    const jwt = require("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret";
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      console.log(`❌ Invalid token for proxy request: ${error.message}`);
      return res.status(403).json({ error: "Forbidden - Invalid token" });
    }

    const { url, method, headers = {}, params = [], bodyType, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`🔗 Proxy request: ${method} ${url} by user: ${req.user.username}`);

    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    let response;
    let responseData;
    let responseHeaders = {};

    try {
      // Build target URL with query parameters
      const targetUrl = new URL(url);
      if (params && params.length > 0) {
        params.forEach(param => {
          if (param.key && param.value) {
            targetUrl.searchParams.set(param.key, param.value);
          }
        });
      }

      // Prepare request headers
      const requestHeaders = { ...headers };
      delete requestHeaders.host;
      
      // Prepare request body
      let requestBody = null;
      if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
        if (bodyType === 'json') {
          requestHeaders['Content-Type'] = 'application/json';
          requestBody = JSON.stringify(body);
        } else if (bodyType === 'form') {
          const formData = new FormData();
          Object.keys(body).forEach(key => {
            formData.append(key, body[key]);
          });
          requestBody = formData;
          requestHeaders['Content-Type'] = 'multipart/form-data';
        } else {
          requestHeaders['Content-Type'] = 'text/plain';
          requestBody = body;
        }
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      response = await fetch(targetUrl.toString(), {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
        timeout: 30000
      });

      clearTimeout(timeout);

      // Collect response headers
      responseHeaders = {};
      response.headers.forEach((value, name) => {
        responseHeaders[name] = value;
      });

      // Handle response
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType.includes('text/html')) {
        responseData = {
          message: "HTML response received",
          contentType,
          preview: await response.text().substring(0, 500),
          isHtml: true
        };
      } else {
        responseData = await response.text();
      }

      console.log(`✅ Proxy response: ${response.status} for ${method} ${url}`);

      res.json({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseData,
        url: targetUrl.toString()
      });

    } catch (error) {
      console.error('❌ Proxy request failed:', error.message);
      
      if (error.name === 'AbortError') {
        return res.status(408).json({
          error: "Request timeout",
          message: "The request took too long to complete"
        });
      }

      res.status(500).json({ 
        error: "Failed to fetch URL",
        details: error.message,
        url: url,
        method: method
      });
    }
  } catch (error) {
    console.error('❌ Proxy route error:', error);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

// ─── Error Handler ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({
      error: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message
    });
  }
});

// ─── Graceful Shutdown ───────────────────────────────────────────
const gracefulShutdown = (signal) => {
  console.log(`📡 Received ${signal}, starting graceful shutdown`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Start Server ───────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ApiPilot backend server running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/auth/login`);
  console.log(`📡 Proxy endpoint: http://localhost:${PORT}/proxy`);
  console.log(`✅ Server is ready for connections!`);
});
