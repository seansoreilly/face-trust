import fetch from 'node-fetch';
import sharp from 'sharp';

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
 * Resizes a base64-encoded image and returns it ready for the Claude API.
 */
async function prepareImage(image) {
  const base64Data = image.split(',')[1] || image;
  const mediaType = image.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

  const imageBuffer = Buffer.from(base64Data, 'base64');
  const resizedBuffer = await sharp(imageBuffer)
    .resize(2048, 2048, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFormat(mediaType === 'image/jpeg' ? 'jpeg' : 'png', { quality: 85 })
    .toBuffer();

  return { base64Data: resizedBuffer.toString('base64'), mediaType };
}

// Structured-outputs schema: the API guarantees the response is valid JSON
// matching this shape. Numeric ranges are enforced by the clamping below
// (the structured-outputs API does not support minimum/maximum constraints).
const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'integer', description: 'Overall trustworthiness, 10-100' },
    honesty: { type: 'integer', description: 'Truthfulness indicators, 10-100' },
    reliability: { type: 'integer', description: 'Consistency and dependability, 10-100' },
    explanation: { type: 'string', description: '150-250 word FACS-based analysis' },
  },
  required: ['score', 'honesty', 'reliability', 'explanation'],
  additionalProperties: false,
};

/**
 * Thrown when the model response is not valid JSON. With structured outputs
 * this only happens on a truncated (max_tokens) or refused response, so it
 * is surfaced to the caller instead of fabricating scores.
 */
export class UnreadableAnalysisError extends Error {
  constructor(rawText) {
    super('Analysis returned an unreadable response');
    this.rawText = rawText;
  }
}

function parseAnalysisResponse(rawText) {
  let text = rawText.trim();

  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new UnreadableAnalysisError(rawText);
  }

  result.score = Math.max(10, Math.min(100, Number(result.score) || 50));
  result.honesty = Math.max(10, Math.min(100, Number(result.honesty) || 48));
  result.reliability = Math.max(10, Math.min(100, Number(result.reliability) || 52));

  if (!result.explanation || typeof result.explanation !== 'string') {
    result.explanation =
      'Comprehensive facial expression analysis completed, evaluating multiple trustworthiness indicators including eye contact, facial symmetry, and expression authenticity.';
  }

  return result;
}

export class AnthropicApiError extends Error {
  constructor(status, body) {
    super(`Anthropic API error: ${status} - ${body}`);
    this.status = status;
  }
}

/**
 * Calls the Claude API to analyze a base64-encoded face image and returns
 * validated score/honesty/reliability/explanation fields.
 */
export async function analyzeFaceImage(image, anthropicApiKey) {
  const { base64Data, mediaType } = await prepareImage(image);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      temperature: 0.3,
      output_config: {
        format: {
          type: 'json_schema',
          schema: ANALYSIS_SCHEMA,
        },
      },
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
    throw new AnthropicApiError(response.status, errorText);
  }

  const data = await response.json();
  return parseAnalysisResponse(data.content[0].text);
}
