import { applyCors } from '../lib/cors.js';
import { checkRateLimit } from '../lib/rate-limit.js';
import { analyzeFace, assertValidApiKey, ValidationError } from '../lib/analyze-core.js';

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'Too many requests, please try again shortly' });
    return;
  }

  const startedAt = Date.now();
  console.log('Face analysis request received');

  try {
    const { image } = req.body || {};

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    try {
      assertValidApiKey(anthropicApiKey);
    } catch (err) {
      console.error('Anthropic API key misconfigured:', err.message);
      res.status(500).json({ error: 'Analysis failed' });
      return;
    }

    const analysisResult = await analyzeFace(image, anthropicApiKey);

    console.log(`Analysis completed in ${Date.now() - startedAt}ms`);
    res.json(analysisResult);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation error:', error.message);
      res.status(400).json({ error: error.message });
      return;
    }

    console.error('Error in face analysis:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
}
