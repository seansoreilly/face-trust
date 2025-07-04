export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log("🔍 Environment Variable Test Endpoint Called");
    
    // Get environment information
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      isVercel: !!process.env.VERCEL,
      vercelRegion: process.env.VERCEL_REGION,
      totalEnvVars: Object.keys(process.env).length,
      
      // Check for Anthropic API key
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
      anthropicKeyLength: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0,
      anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' : 'NOT_FOUND',
      
      // Check for other common API keys
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasPerplexityKey: !!process.env.PERPLEXITY_API_KEY,
      
      // List all environment variables that contain 'API' or 'KEY'
      apiRelatedVars: Object.keys(process.env).filter(key => 
        key.includes('API') || key.includes('KEY')
      ).sort(),
      
      // List all environment variables starting with common prefixes
      anthropicVars: Object.keys(process.env).filter(key => 
        key.includes('ANTHROPIC')
      ).sort(),
      
      // All environment variable names (for debugging)
      allEnvVars: Object.keys(process.env).sort()
    };

    // Log to console for server-side debugging
    console.log("🔍 Environment Info:", JSON.stringify(envInfo, null, 2));

    // Return the information
    res.status(200).json({
      message: "Environment variable test endpoint",
      timestamp: new Date().toISOString(),
      environment: envInfo
    });

  } catch (error) {
    console.error("💥 Error in environment test:", error);
    res.status(500).json({
      error: "Environment test failed",
      details: error.message
    });
  }
}