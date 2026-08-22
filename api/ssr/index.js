/**
 * Vercel serverless function for Angular SSR.
 *
 * Uses a CommonJS wrapper with dynamic import() to load the ESM server bundle
 * (`dist/calorie-counter/server/server.mjs`). Vercel auto-detects this as a
 * Node.js function without needing an explicit `functions` runtime config.
 */
let cached;

module.exports = async function handler(req, res) {
  if (!cached) {
    const mod = await import('../../dist/calorie-counter/server/server.mjs');
    cached = mod.reqHandler;
  }
  return cached(req, res);
};
