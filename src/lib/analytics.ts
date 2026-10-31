/**
 * Google Analytics helpers shared by the tag loader and the event hook.
 *
 * GA only runs on the production hostnames so previews (*.lovable.app,
 * *.vercel.app) and localhost stay out of reports.
 */

const PRODUCTION_HOSTNAMES: readonly string[] = ["facetrust.info", "www.facetrust.info"];

export type ScoreBand = "guarded" | "neutral" | "trustworthy" | "very_trustworthy" | "highly_trustworthy";

export type ErrorType =
  | "read_failed"
  | "api_4xx"
  | "api_5xx"
  | "invalid_response"
  | "network"
  | "aborted"
  | "unknown";

/** Event names and their parameters. Keep in sync with GA4 custom dimensions. */
export interface AnalyticsEvents {
  file_selected: { file_type: string };
  analysis_started: { file_type: string };
  analysis_completed: { score: number; score_band: ScoreBand };
  analysis_error: { error_type: ErrorType };
  results_viewed: { score: number; score_band: ScoreBand };
  retry_analysis: { score_band: ScoreBand };
  share_results: { share_method: "web_share_api" | "download"; score_band: ScoreBand };
  share_error: { error_type: ErrorType };
}

export const isProductionHostname = (hostname: string): boolean =>
  PRODUCTION_HOSTNAMES.includes(hostname.toLowerCase());

export const shouldLoadAnalytics = (): boolean =>
  typeof window !== "undefined" && isProductionHostname(window.location.hostname);

/** Mirrors the thresholds in getScoreCategory (src/lib/scoring.ts). */
export const getScoreBand = (score: number): ScoreBand => {
  if (score > 85) return "highly_trustworthy";
  if (score > 70) return "very_trustworthy";
  if (score > 55) return "trustworthy";
  if (score > 40) return "neutral";
  return "guarded";
};

/** Maps a thrown value to a low-cardinality label; never sends the raw message. */
export const classifyError = (error: unknown): ErrorType => {
  if (error instanceof DOMException && error.name === "AbortError") return "aborted";
  if (error instanceof TypeError) return "network";
  if (!(error instanceof Error)) return "unknown";

  const status = /^API request failed: (\d{3})/.exec(error.message)?.[1];
  if (status) return status.startsWith("4") ? "api_4xx" : "api_5xx";
  if (error.message.startsWith("Invalid response format")) return "invalid_response";
  if (error.message.startsWith("Failed to read image")) return "read_failed";
  return "unknown";
};

/** Sends an event to GA4; a no-op unless the tag was loaded on a production hostname. */
export const sendEvent = <K extends keyof AnalyticsEvents>(
  eventName: K,
  params: AnalyticsEvents[K]
): void => {
  if (!shouldLoadAnalytics() || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, params);
};
