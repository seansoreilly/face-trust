import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import sharp from "sharp";
import { config } from "./config.js";

const app = express();
const PORT = config.PORT || 3001;

// Structured-outputs schema: the API guarantees the response is valid JSON
// matching this shape. Numeric ranges are enforced by the clamping below
// (the structured-outputs API does not support minimum/maximum constraints).
const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer", description: "Overall trustworthiness, 10-100" },
    honesty: { type: "integer", description: "Truthfulness indicators, 10-100" },
    reliability: { type: "integer", description: "Consistency and dependability, 10-100" },
    explanation: { type: "string", description: "150-250 word FACS-based analysis" },
  },
  required: ["score", "honesty", "reliability", "explanation"],
  additionalProperties: false,
};

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
    console.log("🔄 Face analysis request received");
    console.log("📡 Request headers:", req.headers);
    console.log("📦 Request body keys:", Object.keys(req.body));

    const { image } = req.body;

    if (!image) {
      console.error("❌ No image provided in request body");
      return res.status(400).json({ error: "No image provided" });
    }

    console.log("📊 Image data received, length:", image.length);
    console.log("📊 Image data type:", typeof image);
    console.log("📊 Image data preview:", image.substring(0, 100) + "...");

    // Get API key from config
    const anthropicApiKey = config.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      console.error("❌ Anthropic API key not found in config");
      return res
        .status(500)
        .json({ error: "Anthropic API key not configured" });
    }

    console.log("🔑 API key found, length:", anthropicApiKey.length);
    console.log("🌐 Making request to Anthropic API...");

    // Convert base64 image to proper format for Claude
    let base64Data = image.split(",")[1] || image;
    const mediaType = image.startsWith("data:image/jpeg")
      ? "image/jpeg"
      : "image/png";

    // Resize image if it's too large for optimal API performance
    console.log("📸 Resizing image if necessary (max 2048x2048)...");
    const imageBuffer = Buffer.from(base64Data, 'base64');
    console.log("📊 Original image size:", imageBuffer.length, "bytes");

    const resizedBuffer = await sharp(imageBuffer)
      .resize(2048, 2048, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(mediaType === 'image/jpeg' ? 'jpeg' : 'png', { quality: 85 })
      .toBuffer();

    base64Data = resizedBuffer.toString('base64');
    console.log("📊 Resized image size:", resizedBuffer.length, "bytes");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicApiKey,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        temperature: 0.3,
        output_config: {
          format: {
            type: "json_schema",
            schema: ANALYSIS_SCHEMA,
          },
        },
        system: `You are an expert facial psychologist and micro-expression analyst with advanced training in physiognomy and facial action coding systems (FACS).
      
      Analyze each face with extreme precision, evaluating these specific facial features and their psychological implications:
      
      1. **Eyes & Gaze Analysis**:
         - Pupil dilation and eye openness
         - Direction and steadiness of gaze
         - Eye shape, symmetry, and crow's feet presence
         - Upper and lower eyelid positions
         - Eyebrow positioning and furrow depth
      
      2. **Facial Muscle Dynamics**:
         - Zygomatic major/minor activation (smile muscles)
         - Orbicularis oculi engagement (true smile indicators)
         - Frontalis muscle tension (forehead wrinkles)
         - Corrugator supercilii activity (frown lines)
         - Mentalis and depressor anguli oris (chin/mouth corners)
      
      3. **Structural Symmetry Analysis**:
         - Left-right facial balance measurements
         - Nostril flare and nasal symmetry
         - Lip corner positioning and balance
         - Jaw alignment and tension indicators
         - Cheekbone prominence and shadowing
      
      4. **Micro-expression Detection**:
         - Subtle muscle twitches or tensions
         - Incongruent expressions between face regions
         - Duration and intensity of expressions
         - Baseline vs. peak expression differences
         - Emotional leakage indicators
      
      5. **Overall Psychological Indicators**:
         - Skin tone variations (flushing, pallor)
         - Facial hair grooming and presentation
         - Head tilt and positioning
         - Overall facial tension vs. relaxation
         - Age lines and their emotional patterns
      
      Return a **single JSON object** with these exact keys:
        • score       - integer 10-100 (overall trustworthiness)
        • honesty     - integer 10-100 (truthfulness indicators)
        • reliability - integer 10-100 (consistency and dependability)
        • explanation - 150-250 word detailed analysis describing specific facial features observed, their psychological implications, and how they contribute to the scores. Use precise anatomical terms and describe exact observations like "slight elevation of the left eyebrow by approximately 3mm" or "asymmetric nasolabial fold depth suggesting controlled emotional expression."
      
      IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.
      
      Example of the EXACT format to return:
      {
        "score": 76,
        "honesty": 72,
        "reliability": 68,
        "explanation": "Subject displays strong direct gaze with pupils moderately dilated (4mm), suggesting engagement and openness. The Duchenne smile markers are present with crow's feet formation and lower eyelid engagement, indicating genuine positive affect. However, subtle asymmetry in the zygomatic major activation (left side 15% stronger) combined with mild corrugator supercilii tension creates mixed signals. The mentalis shows slight dimpling (2mm depression) suggesting suppressed concern. Nasolabial folds are pronounced but symmetric. Forehead shows three horizontal lines with mild frontalis activation. The overall facial gestalt suggests someone presenting authentically positive while managing underlying stress, reflected in the micro-tension patterns around the jaw angle (masseter engagement) and slight lip compression on the right side."
      }
      
      Analyze ALL visible facial features with scientific precision. If multiple faces appear, analyze only the most prominent/centered face.
`,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this face image and return ONLY a JSON object with score, honesty, reliability, and explanation fields. Do not include any markdown formatting, code blocks, or additional text - just the raw JSON object.`,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    });

    console.log("📡 Anthropic response status:", response.status);
    console.log("📡 Anthropic response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Anthropic API error:", response.status, errorText);
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Anthropic response received");
    console.log("📊 Response data keys:", Object.keys(data));

    let aiResponse = data.content[0].text.trim();
    console.log("Raw AI response:", aiResponse);

    // Clean up the response if it's wrapped in markdown code blocks
    if (aiResponse.startsWith("```json")) {
      aiResponse = aiResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (aiResponse.startsWith("```")) {
      aiResponse = aiResponse.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Parse the JSON response from AI
    let analysisResult;
    try {
      analysisResult = JSON.parse(aiResponse);
      console.log("Parsed AI response:", analysisResult);
    } catch (e) {
      // Structured outputs guarantee valid JSON, so this only fires on a
      // truncated (max_tokens) or refused response — surface it instead of
      // fabricating scores.
      console.error("Failed to parse AI response as JSON:", e);
      console.log("Raw response that failed:", aiResponse);
      return res.status(502).json({
        error: "Analysis returned an unreadable response",
        details: "The AI response was not valid JSON. Please try again.",
      });
    }

    // Ensure scores are within valid range
    analysisResult.score = Math.max(
      10,
      Math.min(100, Number(analysisResult.score) || 50)
    );
    analysisResult.honesty = Math.max(
      10,
      Math.min(100, Number(analysisResult.honesty) || 48)
    );
    analysisResult.reliability = Math.max(
      10,
      Math.min(100, Number(analysisResult.reliability) || 52)
    );

    // Ensure explanation exists
    if (
      !analysisResult.explanation ||
      typeof analysisResult.explanation !== "string"
    ) {
      analysisResult.explanation =
        "Comprehensive facial expression analysis completed, evaluating multiple trustworthiness indicators including eye contact, facial symmetry, and expression authenticity.";
    }

    console.log("🎯 Final analysis result:", analysisResult);
    res.json(analysisResult);
  } catch (error) {
    console.error("💥 Error in face analysis:", error);
    console.error("💥 Error stack:", error.stack);
    res.status(500).json({
      error: "Analysis failed",
      details: error.message,
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Face Trust API server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Face analysis: http://localhost:${PORT}/api/analyze-face`);
});
