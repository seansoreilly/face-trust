export default async function handler(req, res) {
  // No CORS headers: this is a debug endpoint and must not be readable cross-origin.
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const isDev = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';

  if (!isDev) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  try {
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      isVercel: !!process.env.VERCEL,
      vercelRegion: process.env.VERCEL_REGION,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    };

    res.status(200).json({
      message: 'Environment variable test endpoint',
      timestamp: new Date().toISOString(),
      environment: envInfo
    });
  } catch (error) {
    console.error('Error in environment test:', error);
    res.status(500).json({ error: 'Environment test failed' });
  }
}
