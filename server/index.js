import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { ALLOWED_ORIGINS } from "../lib/cors.js";
import { analyzeFace, assertValidApiKey, ValidationError } from "../lib/analyze-core.js";

const app = express();
const PORT = config.PORT || 3001;

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Face analysis endpoint
app.post("/api/analyze-face", async (req, res) => {
  const startedAt = Date.now();
  console.log("Face analysis request received");

  try {
    const { image } = req.body || {};

    const anthropicApiKey = config.ANTHROPIC_API_KEY;
    try {
      assertValidApiKey(anthropicApiKey);
    } catch (err) {
      console.error("Anthropic API key misconfigured:", err.message);
      res.status(500).json({ error: "Analysis failed" });
      return;
    }

    const analysisResult = await analyzeFace(image, anthropicApiKey);

    console.log(`Analysis completed in ${Date.now() - startedAt}ms`);
    res.json(analysisResult);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Validation error:", error.message);
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("Error in face analysis:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Face Trust API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Face analysis: http://localhost:${PORT}/api/analyze-face`);
});
