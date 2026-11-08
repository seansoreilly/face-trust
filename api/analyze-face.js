import { applyCors, createRateLimiter, getClientIp, InvalidImageError, validateImageInput } from './lib/security.js';
import { analyzeFaceImage, AnthropicApiError, UnreadableAnalysisError } from './lib/analyzeFace.js';

// Best-effort limiter: state is per warm serverless instance (not shared across
// instances, reset on cold start), so it only blunts bursts. The durable
// controls are a Vercel WAF rate-limit rule and an Anthropic spend limit.
const rateLimit = createRateLimiter({ perKeyMax: 10, windowMs: 10 * 60 * 1000, globalMax: 200 });

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const limit = rateLimit(getClientIp(req));
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  const isDev = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';

  try {
    validateImageInput(req.body?.image);
    const { image } = req.body;

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      console.error('Anthropic API key not configured');
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    if (!anthropicApiKey.startsWith('sk-ant-')) {
      console.error('Anthropic API key format invalid - should start with "sk-ant-"');
      return res.status(500).json({ error: 'Anthropic API key format invalid' });
    }

    const analysisResult = await analyzeFaceImage(image, anthropicApiKey);
    res.json(analysisResult);
  } catch (error) {
    if (error instanceof InvalidImageError) {
      return res.status(400).json({ error: error.message });
    }

    console.error('Error in face analysis:', error);

    if (error instanceof UnreadableAnalysisError) {
      return res.status(502).json({
        error: 'Analysis returned an unreadable response',
        details: 'The AI response was not valid JSON. Please try again.',
      });
    }

    const errorResponse = { error: 'Analysis failed' };
    if (isDev) {
      errorResponse.details = error.message;
      errorResponse.stack = error.stack;
      if (error instanceof AnthropicApiError) {
        errorResponse.upstreamStatus = error.status;
      }
    }

    res.status(500).json(errorResponse);
  }
}
