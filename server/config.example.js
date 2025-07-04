// Example configuration file - DO NOT use actual API keys here
// Set up your environment variables in a .env file instead
export const config = {
  // Primary AI API Keys (set these in your .env file)
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "your_anthropic_api_key_here",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "your_openai_api_key_here",
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || "your_perplexity_api_key_here",
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || "your_google_api_key_here",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "your_openrouter_api_key_here",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "your_groq_api_key_here",

  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
};
