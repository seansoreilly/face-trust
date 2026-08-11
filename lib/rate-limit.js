// Minimal in-memory per-IP rate limiter.
//
// NOTE: This is per-instance, best-effort only. Under Vercel Fluid Compute
// (or any multi-instance deployment), each instance keeps its own Map, so
// the effective limit is roughly (limit * concurrently-warm instances),
// not a hard global cap. Good enough to blunt casual abuse; not a
// substitute for a shared store (e.g. Redis) if strict enforcement matters.

/** Max requests allowed per IP within the rolling window. */
export const RATE_LIMIT_MAX_REQUESTS = 10;

/** Rolling window size in milliseconds (1 minute). */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** How often to sweep stale entries out of the map. */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

/** @type {Map<string, number[]>} ip -> array of request timestamps (ms) */
const requestLog = new Map();

let lastCleanup = Date.now();

function cleanup(now) {
  for (const [ip, timestamps] of requestLog.entries()) {
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) {
      requestLog.delete(ip);
    } else {
      requestLog.set(ip, recent);
    }
  }
  lastCleanup = now;
}

/**
 * Check and record a request for the given IP.
 *
 * @param {string} ip
 * @returns {boolean} true if the request is allowed, false if rate limited
 */
export function checkRateLimit(ip) {
  const now = Date.now();

  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    cleanup(now);
  }

  const timestamps = (requestLog.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return true;
}
