/**
 * Vercel serverless function for Angular SSR.
 *
 * Re-exports the request handler from the built server bundle
 * (`dist/calorie-counter/server/server.mjs`). All non-static routes
 * are rewritten to this function via `vercel.json`, so deep links
 * like `/dashboard` are rendered on the server instead of 404-ing.
 */
import { reqHandler } from '../../dist/calorie-counter/server/server.mjs';

export default reqHandler;
