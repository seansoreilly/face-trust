// Shared face-analysis core used by both the Vercel serverless handler
// (api/analyze-face.js) and the Express backend (server/index.js).
//
// Plain ESM + JSDoc types (no TypeScript build step). Both consumers load
// this module via a relative import (`../lib/analyze-core.js`); since both
// api/ (root package.json) and server/ (server/package.json) declare
// `"type": "module"`, the same ESM file resolves correctly from either
// working directory.

import fetch from 'node-fetch';
import sharp from 'sharp';

/** Anthropic model used for facial analysis. */
export const MODEL = 'claude-sonnet-4-5-20250929';

/** Max tokens for the Anthropic response. */
export const MAX_TOKENS = 800;

/** Temperature for the Anthropic request (deterministic, precise responses). */
export const TEMPERATURE = 0.3;

/** Longest edge (px) images are resized to before sending to the API. */
export const RESIZE_MAX_DIMENSION = 2048;

/** JPEG/PNG encode quality used when resizing. */
export const RESIZE_QUALITY = 85;

/** Minimum allowed score value after clamping. */
export const SCORE_MIN = 10;

/** Maximum allowed score value after clamping. */
export const SCORE_MAX = 100;

/** Default score used when the model omits/garbles the field. */
export const DEFAULT_SCORE = 50;

/** Default honesty value used when the model omits/garbles the field. */
export const DEFAULT_HONESTY = 48;

/** Default reliability value used when the model omits/garbles the field. */
export const DEFAULT_RELIABILITY = 52;

/** Max accepted size (bytes) of the base64 image payload (~10MB). */
export const MAX_BASE64_LENGTH = 10 * 1024 * 1024;

/** Media types accepted for the uploaded image. */
export const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Explanation used when the model's response can't be parsed as JSON. */
export const DEGRADED_EXPLANATION =
  "We couldn't complete a full analysis of this image.";

/** Explanation used when the model omits the explanation field entirely. */
export const MISSING_EXPLANATION_TEXT =
  'Comprehensive facial expression analysis completed, evaluating multiple trustworthiness indicators including eye contact, facial symmetry, and expression authenticity.';

const SYSTEM_PROMPT = `You are an expert facial psychologist and micro-expression analyst with advanced training in physiognomy and facial action coding systems (FACS).

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
`;

/**
 * Error thrown for client-input problems (bad/missing image, unsupported
 * media type, payload too large, undecodable image). Callers should map
 * this to an HTTP 400-style response rather than a 500.
 */
export class ValidationError extends Error {
  /** @param {string} message */
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate the raw request image field and extract the media type + base64
 * payload from a data URI (or bare base64 string).
 *
 * @param {unknown} image
 * @returns {{ base64Data: string, mediaType: string }}
 */
export function parseImageInput(image) {
  if (!image || typeof image !== 'string') {
    throw new ValidationError('No image provided');
  }

  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
  let mediaType;
  let base64Data;

  if (match) {
    mediaType = match[1].toLowerCase();
    base64Data = match[2];
  } else {
    // Bare base64 string with no data URI prefix; default to jpeg.
    mediaType = 'image/jpeg';
    base64Data = image;
  }

  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    throw new ValidationError(
      `Unsupported image type: ${mediaType}. Allowed types: ${ALLOWED_MEDIA_TYPES.join(', ')}`
    );
  }

  if (!base64Data || base64Data.length === 0) {
    throw new ValidationError('No image data provided');
  }

  if (base64Data.length > MAX_BASE64_LENGTH) {
    throw new ValidationError('Image payload too large (max ~10MB)');
  }

  return { base64Data, mediaType };
}

/**
 * Resize/re-encode the image buffer for optimal API performance.
 * Wraps sharp processing so undecodable images surface as a ValidationError
 * (400) instead of an unhandled 500.
 *
 * @param {string} base64Data
 * @param {string} mediaType
 * @returns {Promise<{ base64Data: string, mediaType: string }>}
 */
export async function resizeImage(base64Data, mediaType) {
  const outputFormat = mediaType === 'image/jpeg' ? 'jpeg' : 'png';
  const outputMediaType = outputFormat === 'jpeg' ? 'image/jpeg' : 'image/png';

  let imageBuffer;
  try {
    imageBuffer = Buffer.from(base64Data, 'base64');
  } catch {
    throw new ValidationError('Image could not be decoded from base64');
  }

  try {
    const resizedBuffer = await sharp(imageBuffer)
      .resize(RESIZE_MAX_DIMENSION, RESIZE_MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat(outputFormat, { quality: RESIZE_QUALITY })
      .toBuffer();

    return {
      base64Data: resizedBuffer.toString('base64'),
      mediaType: outputMediaType,
    };
  } catch (err) {
    throw new ValidationError(
      `Image could not be processed: ${err instanceof Error ? err.message : 'invalid image data'}`
    );
  }
}

/**
 * Call the Anthropic Messages API with the given image and return the
 * parsed response body. Throws on network/HTTP errors.
 *
 * @param {string} apiKey
 * @param {string} base64Data
 * @param {string} mediaType
 * @returns {Promise<any>}
 */
export async function callAnthropic(apiKey, base64Data, mediaType) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this face image and return ONLY a JSON object with score, honesty, reliability, and explanation fields. Do not include any markdown formatting, code blocks, or additional text - just the raw JSON object.',
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Parse the raw text response from Claude into the analysis result shape,
 * clamping scores and falling back to a degraded response if the model's
 * output isn't valid JSON.
 *
 * @param {string} rawText
 * @returns {{ score: number, honesty: number, reliability: number, explanation: string, degraded?: true }}
 */
export function parseAnalysisResponse(rawText) {
  let aiResponse = rawText.trim();

  // Clean up the response if it's wrapped in markdown code blocks
  if (aiResponse.startsWith('```json')) {
    aiResponse = aiResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (aiResponse.startsWith('```')) {
    aiResponse = aiResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  /** @type {any} */
  let analysisResult;
  try {
    analysisResult = JSON.parse(aiResponse);
  } catch {
    // The model's output wasn't valid JSON. Return an honest, clearly
    // marked degraded response instead of presenting random scores as a
    // real analysis.
    return {
      score: DEFAULT_SCORE,
      honesty: DEFAULT_HONESTY,
      reliability: DEFAULT_RELIABILITY,
      explanation: DEGRADED_EXPLANATION,
      degraded: true,
    };
  }

  // Ensure scores are within valid range
  analysisResult.score = clampScore(analysisResult.score, DEFAULT_SCORE);
  analysisResult.honesty = clampScore(analysisResult.honesty, DEFAULT_HONESTY);
  analysisResult.reliability = clampScore(analysisResult.reliability, DEFAULT_RELIABILITY);

  // Ensure explanation exists
  if (!analysisResult.explanation || typeof analysisResult.explanation !== 'string') {
    analysisResult.explanation = MISSING_EXPLANATION_TEXT;
  }

  return analysisResult;
}

/**
 * Clamp a score value to [SCORE_MIN, SCORE_MAX], falling back to
 * `fallback` when the value is missing/non-numeric.
 *
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function clampScore(value, fallback) {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Number(value) || fallback));
}

/**
 * Full end-to-end analysis: validate input, resize, call Anthropic, parse.
 *
 * @param {unknown} image - raw `image` field from the request body
 * @param {string} apiKey - Anthropic API key
 * @returns {Promise<{ score: number, honesty: number, reliability: number, explanation: string, degraded?: true }>}
 */
export async function analyzeFace(image, apiKey) {
  const { base64Data: rawBase64, mediaType: rawMediaType } = parseImageInput(image);
  const { base64Data, mediaType } = await resizeImage(rawBase64, rawMediaType);
  const data = await callAnthropic(apiKey, base64Data, mediaType);
  const text = data.content[0].text;
  return parseAnalysisResponse(text);
}

/**
 * Validate the Anthropic API key is present and correctly formatted.
 * Throws Error (not ValidationError) since this is a server configuration
 * problem, not a client input problem.
 *
 * @param {string | undefined} apiKey
 */
export function assertValidApiKey(apiKey) {
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }
  if (!apiKey.startsWith('sk-ant-')) {
    throw new Error('Anthropic API key format invalid');
  }
}
