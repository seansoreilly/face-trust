/**
 * Shared score → presentation mappings for trust/honesty/reliability scores.
 * Consolidates logic previously duplicated between Results.tsx and Index.tsx.
 */

export function getScoreCategory(score: number): string {
  if (score > 85) return "Highly Trustworthy";
  if (score > 70) return "Very Trustworthy";
  if (score > 55) return "Trustworthy";
  if (score > 40) return "Neutral";
  return "Guarded";
}

export function getScoreColor(score: number): string {
  if (score > 80) return "from-green-400 to-emerald-500";
  if (score > 60) return "from-blue-400 to-cyan-500";
  if (score > 40) return "from-yellow-400 to-orange-500";
  return "from-red-400 to-pink-500";
}

export function getScoreEmoji(score: number): string {
  if (score > 85) return "🌟";
  if (score > 70) return "😊";
  if (score > 55) return "🙂";
  if (score > 40) return "😐";
  return "🤔";
}
