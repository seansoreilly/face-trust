import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import {
  applyCors,
  createRateLimiter,
  getClientIp,
  InvalidImageError,
  isAllowedOrigin,
  MAX_IMAGE_BYTES,
  validateImageInput,
} from './security.js';

const b64 = (n) => Buffer.alloc(n, 1).toString('base64');

describe('validateImageInput', () => {
  it('accepts jpeg and png data URIs', () => {
    expect(validateImageInput(`data:image/jpeg;base64,${b64(10)}`).mediaType).toBe('image/jpeg');
    expect(validateImageInput(`data:image/png;base64,${b64(10)}`).mediaType).toBe('image/png');
  });

  it.each([
    undefined,
    null,
    '',
    42,
    { a: 1 },
    'data:image/gif;base64,AAAA',
    'data:image/svg+xml;base64,AAAA',
    'data:text/html;base64,AAAA',
    'https://example.com/a.png',
    'data:image/png;base64,',
    'data:image/png;base64,@@@@',
  ])('rejects %j', (v) => {
    expect(() => validateImageInput(v)).toThrow(InvalidImageError);
  });

  it('rejects images over the size cap', () => {
    expect(() => validateImageInput(`data:image/png;base64,${b64(MAX_IMAGE_BYTES + 10)}`)).toThrow(/too large/);
  });

  it('accepts an image just under the cap', () => {
    expect(() => validateImageInput(`data:image/png;base64,${b64(MAX_IMAGE_BYTES - 10)}`)).not.toThrow();
  });
});

describe('applyCors', () => {
  const make = (origin) => {
    const headers = {};
    return { req: { headers: origin ? { origin } : {} }, res: { setHeader: (k, v) => (headers[k] = v) }, headers };
  };

  it('echoes allowlisted origins', () => {
    const { req, res, headers } = make('https://facetrust.info');
    applyCors(req, res);
    expect(headers['Access-Control-Allow-Origin']).toBe('https://facetrust.info');
    expect(headers.Vary).toBe('Origin');
  });

  it('allows localhost dev origins', () => {
    const { req, res, headers } = make('http://localhost:5173');
    applyCors(req, res);
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
  });

  it('does not allow other origins and never uses *', () => {
    const { req, res, headers } = make('https://evil.example');
    applyCors(req, res);
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('allows this project\'s own Vercel preview origins', () => {
    for (const o of [
      'https://face-trust-abc123xyz-melbourne-computing.vercel.app',
      'https://face-trust-git-security-weekly-melbourne-computing.vercel.app',
    ]) {
      const { req, res, headers } = make(o);
      applyCors(req, res);
      expect(headers['Access-Control-Allow-Origin']).toBe(o);
    }
  });

  it('rejects look-alike and foreign vercel origins', () => {
    for (const o of [
      'https://evil.vercel.app',
      'https://other-project-abc-melbourne-computing.vercel.app',
      'https://face-trust-abc-other-team.vercel.app',
      'https://face-trust-abc-melbourne-computing.vercel.app.evil.com',
      'https://evil.com/face-trust-abc-melbourne-computing.vercel.app',
      'http://face-trust-abc-melbourne-computing.vercel.app',
      'https://xface-trust-abc-melbourne-computing.vercel.app',
      'https://face-trust-.evil-melbourne-computing.vercel.app',
    ]) {
      expect(isAllowedOrigin(o), o).toBe(false);
    }
  });

  it('sets nothing for same-origin requests without an Origin header', () => {
    const { req, res, headers } = make();
    applyCors(req, res);
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });
});

describe('createRateLimiter', () => {
  let t;
  const now = () => t;
  beforeEach(() => (t = 1000));

  it('limits per key and reports Retry-After', () => {
    const check = createRateLimiter({ perKeyMax: 2, windowMs: 60000, globalMax: 100, now });
    expect(check('a').allowed).toBe(true);
    expect(check('a').allowed).toBe(true);
    const blocked = check('a');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfter).toBe(60);
    expect(check('b').allowed).toBe(true);
  });

  it('resets after the window', () => {
    const check = createRateLimiter({ perKeyMax: 1, windowMs: 1000, globalMax: 100, now });
    check('a');
    expect(check('a').allowed).toBe(false);
    t += 1001;
    expect(check('a').allowed).toBe(true);
  });

  it('enforces the global cap across keys', () => {
    const check = createRateLimiter({ perKeyMax: 5, windowMs: 1000, globalMax: 2, now });
    expect(check('a').allowed).toBe(true);
    expect(check('b').allowed).toBe(true);
    expect(check('c').allowed).toBe(false);
  });
});

describe('getClientIp', () => {
  it('uses the first x-forwarded-for entry', () => {
    expect(getClientIp({ headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } })).toBe('1.2.3.4');
  });
  it('falls back to x-real-ip then socket', () => {
    expect(getClientIp({ headers: { 'x-real-ip': '5.6.7.8' } })).toBe('5.6.7.8');
    expect(getClientIp({ headers: {}, socket: { remoteAddress: '9.9.9.9' } })).toBe('9.9.9.9');
  });
});

describe('analyze-face handler', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
  });

  const mockRes = () => {
    const r = { headers: {}, statusCode: 200 };
    r.setHeader = (k, v) => (r.headers[k] = v);
    r.status = (c) => ((r.statusCode = c), r);
    r.json = (b) => ((r.body = b), r);
    r.end = () => r;
    return r;
  };

  it('returns 400 for a bad image, 204 for OPTIONS, 429 when limited, and never calls Anthropic for bad input', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.doMock('node-fetch', () => ({ default: fetchSpy }));
    const { default: handler } = await import('../analyze-face.js');
    const req = (body, method = 'POST', ip = '1.1.1.1') => ({
      method,
      body,
      headers: { 'x-forwarded-for': ip, origin: 'https://facetrust.info' },
    });

    let res = mockRes();
    await handler(req({ image: 'data:image/gif;base64,AAAA' }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/data:image/);

    res = mockRes();
    await handler(req(undefined, 'OPTIONS'), res);
    expect(res.statusCode).toBe(204);
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://facetrust.info');

    // A valid-looking data URI that is not a decodable image is a 400, not a 500.
    res = mockRes();
    await handler(req({ image: `data:image/png;base64,${b64(100)}` }), res);
    expect(res.statusCode).toBe(400);

    // Pixel bomb header (declared > 25M pixels) is rejected before decoding.
    const big = await sharp({ create: { width: 6000, height: 5000, channels: 3, background: '#fff' } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    if (big.length < MAX_IMAGE_BYTES) {
      res = mockRes();
      await handler(req({ image: `data:image/png;base64,${big.toString('base64')}` }), res);
      expect(res.statusCode).toBe(400);
    }

    // Exhaust the per-IP limit (3 requests used so far, 1 more if bomb ran).
    let last;
    for (let i = 0; i < 12; i++) {
      last = mockRes();
      await handler(req({ image: 'nope' }, 'POST', '2.2.2.2'), last);
    }
    expect(last.statusCode).toBe(429);
    expect(Number(last.headers['Retry-After'])).toBeGreaterThan(0);

    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
