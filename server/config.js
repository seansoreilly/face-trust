// Configuration file using environment variables
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Primary AI API Keys from environment variables
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,

  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
};
