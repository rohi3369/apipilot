const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret";

// FIX: `authenticate` (API key middleware) was imported in server.js but never used
// on any route — keeping it here in case you want to add API-key-protected routes,
// but it has been removed from server.js imports to avoid dead code confusion.
const authenticate = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.API_KEY || "default-api-key-for-testing";

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ error: "Unauthorized - Invalid API key" });
  }

  next();
};

// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Forbidden - Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticate, authenticateJWT };
