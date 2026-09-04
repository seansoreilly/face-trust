import { analyzeFaceImage, AnthropicApiError } from './lib/analyzeFace.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const isDev = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

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
    console.error('Error in face analysis:', error);

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
