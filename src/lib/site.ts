/**
 * Deployment-aware site URL resolution.
 *
 * Vercel does not know its own public URL at build time, so canonical links and
 * Open Graph URLs have to be derived at runtime from the platform's own
 * environment variables. Order of preference:
 *
 *   1. SITE_URL, an explicit override for a custom domain.
 *   2. VERCEL_PROJECT_PRODUCTION_URL, stable across production deployments.
 *   3. VERCEL_URL, the immutable per-deployment hostname, correct for previews.
 *   4. localhost, for development.
 *
 * Only NEXT_PUBLIC_ prefixed variables ever reach the browser. Everything read
 * here is read on the server, and none of these values are secret.
 */

const FALLBACK = "http://localhost:3000";

function normalise(value: string): string {
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const explicit = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && explicit.trim()) return normalise(explicit.trim());

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production && production.trim()) return normalise(production.trim());

  const deployment = process.env.VERCEL_URL;
  if (deployment && deployment.trim()) return normalise(deployment.trim());

  return FALLBACK;
}

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** True when running on a Vercel preview rather than production. */
export function isPreviewEnvironment(): boolean {
  if (process.env.PREVIEW === "1") return true;
  return process.env.VERCEL_ENV === "preview";
}
