import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { analyzeFaceImage, AnthropicApiError, UnreadableAnalysisError } from "../api/lib/analyzeFace.js";

const app = express();
const PORT = config.PORT || 3001;
const isDev = (config.NODE_ENV || process.env.NODE_ENV) === "development";

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://127.0.0.1:8080', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Face analysis endpoint
app.post("/api/analyze-face", async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

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
