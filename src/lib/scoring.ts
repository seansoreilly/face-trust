/**
 * Shared scoring thresholds used across the upload, results, and share-image flows.
 */

export const getEmoji = (score: number): string => {
  if (score > 85) return "🌟";
  if (score > 70) return "😊";
  if (score > 55) return "🙂";
  if (score > 40) return "😐";
  return "🤔";
};

export const getScoreCategory = (score: number): string => {
  if (score > 85) return "Highly Trustworthy";
  if (score > 70) return "Very Trustworthy";
  if (score > 55) return "Trustworthy";
  if (score > 40) return "Neutral";
  return "Guarded";
};

/** Tailwind gradient classes for text/UI elements, keyed by score. */
export const getScoreGradient = (score: number): string => {
  if (score > 80) return "from-green-400 to-emerald-500";
  if (score > 60) return "from-blue-400 to-cyan-500";
  if (score > 40) return "from-yellow-400 to-orange-500";
  return "from-red-400 to-pink-500";
};

/** Hex colors for canvas rendering, keyed by score. Matches the Tailwind gradient stops above. */
export const getScoreHexColor = (score: number): string => {
  if (score > 80) return "#10b981";
  if (score > 60) return "#06b6d4";
  if (score > 40) return "#f59e0b";
  return "#ef4444";
};
