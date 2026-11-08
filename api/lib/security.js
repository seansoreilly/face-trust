// Request hardening helpers shared by the Vercel function (api/analyze-face.js)
// and the Express backend (server/index.js).

// ---------------------------------------------------------------------------
// Image validation
// ---------------------------------------------------------------------------

export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // decoded size cap (~3 MB)
export const MAX_IMAGE_PIXELS = 25e6; // passed to sharp's limitInputPixels

const DATA_URI_PREFIX = /^data:image\/(jpeg|png);base64,/;
const BASE64_BODY = /^[A-Za-z0-9+/]+={0,2}$/;

export class InvalidImageError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidImageError';
    this.status = 400;
  }
}

/**
 * Validates the `image` request field and returns the decoded buffer and
 * media type. Throws InvalidImageError (HTTP 400) on any problem.
 */
export function validateImageInput(image) {
  if (typeof image !== 'string' || image.length === 0) {
    throw new InvalidImageError('No image provided');
  }
  const match = DATA_URI_PREFIX.exec(image);
  if (!match) {
    throw new InvalidImageError('Image must be a data:image/jpeg or data:image/png base64 data URI');
  }
  const base64Data = image.slice(match[0].length);
  // Check the encoded length before decoding so oversized payloads are cheap to reject.
  if (Math.floor((base64Data.length * 3) / 4) > MAX_IMAGE_BYTES) {
    throw new InvalidImageError(`Image too large (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`);
  }
  if (!BASE64_BODY.test(base64Data)) {
    throw new InvalidImageError('Image is not valid base64');
  }
  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
    throw new InvalidImageError(`Image empty or too large (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`);
  }
  return { buffer, mediaType: `image/${match[1]}` };
}

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

export const ALLOWED_ORIGINS = [
  'https://facetrust.info',
  'https://www.facetrust.info',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8080',
];

// This project's own Vercel preview deployments only (team slug
// melbourne-computing): face-trust-<hash>-melbourne-computing.vercel.app and
// face-trust-git-<branch>-melbourne-computing.vercel.app. Never a bare *.vercel.app.
export const PREVIEW_ORIGIN_PATTERN = /^https:\/\/face-trust-[a-z0-9-]+-melbourne-computing\.vercel\.app$/;

export function isAllowedOrigin(origin) {
  return typeof origin === 'string' && (ALLOWED_ORIGINS.includes(origin) || PREVIEW_ORIGIN_PATTERN.test(origin));
}

/**
 * Sets CORS headers. The allow-origin header is only emitted for allowlisted
 * origins. Same-origin browser requests do not need CORS headers, so they keep
 * working. CORS only constrains browsers; it is not access control for
 * non-browser clients (rate limiting / spend limits cover those).
 */
export function applyCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
  }
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

/**
 * Client IP. On Vercel the platform sets x-forwarded-for (first entry is the
 * client) and x-real-ip; do not use this behind an untrusted proxy.
 */
export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  const first = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0]?.trim();
  return first || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/**
 * Best-effort in-memory limiter: per-key fixed window plus a coarse global cap.
 *
 * LIMITATION: state lives in a single process / warm serverless instance.
 * Vercel runs many instances and recycles them, so this only blunts casual
 * abuse and bursts; it is NOT a durable limit. The durable controls are a
 * Vercel WAF rate-limit rule and an Anthropic spend limit.
 */
export function createRateLimiter({
  perKeyMax = 10,
  windowMs = 10 * 60 * 1000,
  globalMax = 200,
  now = () => Date.now(),
} = {}) {
  const hits = new Map(); // key -> { count, resetAt }
  let global = { count: 0, resetAt: 0 };

  return function check(key) {
    const t = now();
    if (t >= global.resetAt) global = { count: 0, resetAt: t + windowMs };
    if (global.count >= globalMax) {
      return { allowed: false, retryAfter: Math.ceil((global.resetAt - t) / 1000) };
    }
    // Opportunistic cleanup keeps the map bounded.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (t >= v.resetAt) hits.delete(k);
    }
    let entry = hits.get(key);
    if (!entry || t >= entry.resetAt) {
      entry = { count: 0, resetAt: t + windowMs };
      hits.set(key, entry);
    }
    if (entry.count >= perKeyMax) {
      return { allowed: false, retryAfter: Math.ceil((entry.resetAt - t) / 1000) };
    }
    entry.count += 1;
    global.count += 1;
    return { allowed: true, retryAfter: 0 };
  };
}
