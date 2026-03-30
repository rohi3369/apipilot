const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const FormData = require("form-data");
const AbortController = require("abort-controller");
const { authenticateJWT } = require("./auth-middleware");
const { generateToken, refreshToken } = require("./token-auth");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Health Check ─────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "ApiPilot proxy is running" });
});

// ─── Authentication Routes ────────────────────────────────────
app.post("/auth/login", generateToken);
app.post("/auth/refresh", refreshToken);

// ─── Protected User Info ──────────────────────────────────────
app.get("/auth/me", authenticateJWT, (req, res) => {
  res.json({
    user: {
      username: req.user.username,
      role: req.user.role,
    },
  });
});

// ─── Proxy Route ──────────────────────────────────────────────
app.post("/proxy", authenticateJWT, async (req, res) => {
  const { url, method, headers = {}, params = [], bodyType, body } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // FIX #1: Declare variables OUTSIDE try so the catch block can reference them
  let targetUrl = url;
  const upperMethod = (method || "GET").toUpperCase();
  let fetchHeaders = { ...headers };

  try {
    // FIX #2: Support both {k,v} (frontend) and {key,value} (legacy) param shapes
    const enabledParams = params.filter(
      (p) => p.enabled !== false && (p.k || p.key) && (p.v !== undefined || p.value !== undefined)
    );
    if (enabledParams.length > 0) {
      const searchParams = new URLSearchParams();
      enabledParams.forEach((p) => searchParams.append(p.k || p.key, p.v ?? p.value));
      targetUrl += (targetUrl.includes("?") ? "&" : "?") + searchParams.toString();
    }

    // Set Content-Type for JSON if not already set
    if (bodyType === "json" && !fetchHeaders["Content-Type"]) {
      fetchHeaders["Content-Type"] = "application/json";
    }

    // FIX #3: Only attach body for methods that support it (exclude GET, HEAD, OPTIONS)
    let fetchBody = undefined;
    if (!["GET", "HEAD", "OPTIONS"].includes(upperMethod) && body) {
      if (bodyType === "json" || bodyType === "raw") {
        fetchBody = typeof body === "string" ? body : JSON.stringify(body);
      } else if (bodyType === "form-data" && Array.isArray(body)) {
        const fd = new FormData();
        body
          .filter((f) => f.enabled !== false && (f.k || f.key))
          .forEach((f) => fd.append(f.k || f.key, f.v ?? f.value));
        fetchBody = fd;
        delete fetchHeaders["Content-Type"];
        Object.assign(fetchHeaders, fd.getHeaders());
      }
    }

    // FIX #4: Implement timeout via AbortController (node-fetch v2 ignores `timeout`)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const startTime = Date.now();

    const response = await fetch(targetUrl, {
      method: upperMethod,
      headers: fetchHeaders,
      body: fetchBody,
      redirect: "follow",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const elapsed = Date.now() - startTime;
    const responseText = await response.text();

    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return res.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText,
      time: elapsed,
      url: targetUrl,
    });
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    return res.status(502).json({
      error: isTimeout ? "Request timed out after 30 seconds" : err.message,
      detail: isTimeout
        ? "The target server did not respond in time."
        : "The proxy could not reach the target URL. Check if the URL is correct and the server is reachable.",
      url: targetUrl,
      method: upperMethod,
    });
  }
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ ApiPilot proxy running at http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
