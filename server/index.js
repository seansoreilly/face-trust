import express from "express";
import cors from "cors";
import { createRateLimiter, isAllowedOrigin, InvalidImageError, validateImageInput } from "../api/lib/security.js";
import { config } from "./config.js";
import { analyzeFaceImage, AnthropicApiError, UnreadableAnalysisError } from "../api/lib/analyzeFace.js";

const app = express();
const PORT = config.PORT || 3001;
const isDev = (config.NODE_ENV || process.env.NODE_ENV) === "development";

// Middleware
app.use(cors({ origin: (origin, cb) => cb(null, !origin || isAllowedOrigin(origin)), methods: ["GET", "POST", "OPTIONS"] }));
// 3 MB decoded image is ~4 MB base64; leave headroom for the JSON wrapper.
app.use(express.json({ limit: "5mb" }));

// Best-effort limiter: in-process only (resets on restart, not shared between
// instances). Keyed on the socket address; set TRUST_PROXY=1 only when running
// behind a proxy that overwrites X-Forwarded-For. A WAF rule and an Anthropic
// spend limit are the durable controls.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
const rateLimit = createRateLimiter({ perKeyMax: 10, windowMs: 10 * 60 * 1000, globalMax: 200 });

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Face analysis endpoint
app.post("/api/analyze-face", async (req, res) => {
  const limit = rateLimit(req.ip || "unknown");
  if (!limit.allowed) {
    res.set("Retry-After", String(limit.retryAfter));
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  try {
    validateImageInput(req.body?.image);
    const { image } = req.body;

    const anthropicApiKey = config.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      console.error("Anthropic API key not found in config");
      return res
        .status(500)
        .json({ error: "Anthropic API key not configured" });
    }

    const analysisResult = await analyzeFaceImage(image, anthropicApiKey);
    res.json(analysisResult);
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Error in face analysis:", error);

    if (error instanceof UnreadableAnalysisError) {
      return res.status(502).json({
        error: "Analysis returned an unreadable response",
        details: "The AI response was not valid JSON. Please try again.",
      });
    }

    const errorResponse = { error: "Analysis failed" };
    if (isDev) {
      errorResponse.details = error.message;
      errorResponse.stack = error.stack;
      if (error instanceof AnthropicApiError) {
        errorResponse.upstreamStatus = error.status;
      }
    }

    res.status(500).json(errorResponse);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Face Trust API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Face analysis: http://localhost:${PORT}/api/analyze-face`);
});
