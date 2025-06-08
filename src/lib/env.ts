/**
 * Environment Configuration
 * 
 * This module centralizes all environment variable access and validation.
 * All environment variables should be accessed through this module rather
 * than directly using import.meta.env throughout the codebase.
 */

export const env = {
  // Google Analytics configuration
  GA_MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || "G-GLHB5EDQ0W",
  
  // API configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "",
  
  // Development configuration
  DEV_MODE: import.meta.env.VITE_DEV_MODE === "true",
  DEBUG: import.meta.env.VITE_DEBUG === "true",
  
  // Node environment
  NODE_ENV: import.meta.env.MODE,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

// Environment variable validation
const validateEnv = () => {
  const errors: string[] = [];

  // Validate required environment variables
  if (!env.GA_MEASUREMENT_ID) {
    errors.push("VITE_GA_MEASUREMENT_ID is required but not provided");
  }

  // Validate Google Analytics ID format
  if (env.GA_MEASUREMENT_ID && !env.GA_MEASUREMENT_ID.match(/^G-[A-Z0-9]+$/)) {
    errors.push("VITE_GA_MEASUREMENT_ID must be in format G-XXXXXXXXXX");
  }

  // Log warnings for optional variables in development
  if (env.IS_DEV) {
    if (!env.API_BASE_URL) {
      console.warn("VITE_API_BASE_URL is not set - using default endpoints");
    }
  }

  // Throw error if any required variables are missing
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
};

// Validate environment on module load
validateEnv();

// Export individual variables for convenience
export const {
  GA_MEASUREMENT_ID,
  API_BASE_URL,
  DEV_MODE,
  DEBUG,
  NODE_ENV,
  IS_DEV,
  IS_PROD
} = env; 