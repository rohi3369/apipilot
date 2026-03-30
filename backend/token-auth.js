const jwt = require("jsonwebtoken");

// FIX: Read credentials from env vars; fall back to hardcoded values only for local dev
const VALID_USERS = {
  [process.env.ADMIN_USER || "admin"]: process.env.ADMIN_PASS || "admin123",
  [process.env.APP_USER || "user"]: process.env.APP_PASS || "user123",
};

const JWT_SECRET = process.env.JWT_SECRET || "default-jwt-secret";

// Token generation endpoint
const generateToken = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password || VALID_USERS[username] !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const role = username === (process.env.ADMIN_USER || "admin") ? "admin" : "user";

  // FIX: Remove manual `iat` — jsonwebtoken sets it automatically
  const token = jwt.sign({ username, role }, JWT_SECRET, { expiresIn: "24h" });

  res.json({
    token,
    expiresIn: "24h",
    user: { username, role },
  });
};

// Token refresh endpoint
const refreshToken = (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // FIX: Remove manual `iat` here too
    const newToken = jwt.sign(
      { username: decoded.username, role: decoded.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ token: newToken, expiresIn: "24h" });
  });
};

module.exports = { generateToken, refreshToken };
