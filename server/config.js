// Configuration file using environment variables
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Primary AI API Key from environment variables
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

  // Server Configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
};
