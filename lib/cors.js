// Shared CORS allowlist for the api/ (Vercel) and server/ (Express) backends.

/** Origins allowed to call the API. */
export const ALLOWED_ORIGINS = [
  'https://facetrust.info',
  'https://www.facetrust.info',
  'http://localhost:5173',
  'http://localhost:3001',
];

/**
 * Apply CORS headers to a Vercel/Node-style response, echoing the request
 * origin only if it's in the allowlist.
 *
 * @param {{ headers?: Record<string, string | string[] | undefined> }} req
 * @param {{ setHeader: (name: string, value: string) => void }} res
 */
export function applyCors(req, res) {
  const origin = req.headers?.origin;
  if (typeof origin === 'string' && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
