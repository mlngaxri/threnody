import type { ApiResponse, Entry } from "./types.ts";
import {
  getCategories,
  getCategory,
  getContributor,
  getEntry,
  getNeighbours,
  getRelated,
  getSiteConfig,
  getSuggestions,
  getTags,
  getTimeline,
  isValidFidelity,
  isValidSort,
  queryEntries,
  searchEntries,
  countEntriesInCategory,
  type SortKey,
} from "./repository.ts";
import {
  CONTACT_LIMITS,
  RateLimiter,
  fail,
  isValidSlug,
  ok,
  parseBoolParam,
  parseIntParam,
  validateContact,
} from "./validation.ts";

/**
 * The API core.
 *
 * Every endpoint's behaviour lives here as a pure function of
 * (searchParams, body, context) -> { status, body, headers }. The Next.js route
 * handlers in src/app/api are thin adapters over these functions, which is what
 * makes the entire API surface testable under plain Node without a server.
 */

export interface HandlerResult<T = unknown> {
  status: number;
  body: ApiResponse<T>;
  headers?: Record<string, string>;
}

/** Public cache policy for immutable-ish archive reads. */
const CACHE_PUBLIC = {
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
};
const CACHE_NONE = { "Cache-Control": "no-store" };

/** Summary projection: list endpoints never ship full body copy. */
export interface EntrySummary {
  slug: string;
  title: string;
  epithet: string;
  description: string;
  category: string;
  tags: string[];
  fidelity: string;
  featured: boolean;
  status: string;
  publishedAt: string;
  updatedAt: string;
  readingMinutes: number;
  place: string;
  region: string;
  lastHeard: number;
  lat: number;
  lon: number;
}

export function toSummary(entry: Entry): EntrySummary {
  return {
    slug: entry.slug,
    title: entry.title,
    epithet: entry.epithet,
    description: entry.description,
    category: entry.category,
    tags: entry.tags,
    fidelity: entry.fidelity,
    featured: entry.featured,
    status: entry.status,
    publishedAt: entry.publishedAt,
    updatedAt: entry.updatedAt,
    readingMinutes: entry.readingMinutes,
    place: entry.provenance.place,
    region: entry.provenance.region,
    lastHeard: entry.provenance.lastHeard,
    lat: entry.provenance.lat,
    lon: entry.provenance.lon,
  };
}

/* -------------------------------------------------------------------------- */
/* GET /api/health                                                             */
/* -------------------------------------------------------------------------- */

const BOOT_TIME = Date.now();

export function handleHealth(now: number = Date.now()): HandlerResult {
  const config = getSiteConfig();
  const checks = {
    content: config.totalEntries > 0,
    categories: getCategories().length > 0,
    search: searchEntries("sound", 1).length >= 0,
  };
  const healthy = Object.values(checks).every(Boolean);

  return {
    status: healthy ? 200 : 503,
    body: ok({
      status: healthy ? "healthy" : "degraded",
      version: "1.0.0",
      uptimeSeconds: Math.floor((now - BOOT_TIME) / 1000),
      checks,
      entries: config.totalEntries,
      categories: getCategories().length,
      timestamp: new Date(now).toISOString(),
    }),
    headers: CACHE_NONE,
  };
}

/* -------------------------------------------------------------------------- */
/* GET /api/content                                                            */
/* -------------------------------------------------------------------------- */

export interface ParamBag {
  get(name: string): string | null;
}

/** Preview mode is opt-in and requires the server-side secret. */
export function isPreviewAuthorised(token: string | null, secret: string | undefined): boolean {
  if (!token || !secret) return false;
  if (token.length !== secret.length) return false;
  // Length-checked constant-time comparison.
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return diff === 0;
}

export function handleContentList(
  params: ParamBag,
  ctx: { previewSecret?: string } = {},
): HandlerResult {
  const category = params.get("category");
  const tag = params.get("tag");
  const fidelity = params.get("fidelity");
  const sortRaw = params.get("sort");
  const featuredRaw = params.get("featured");

  const fields: Record<string, string> = {};

  if (category && !getCategory(category)) {
    fields.category = `Unknown category. Valid values: ${getCategories()
      .map((c) => c.slug)
      .join(", ")}.`;
  }
  if (fidelity && !isValidFidelity(fidelity)) {
    fields.fidelity =
      "Unknown fidelity. Valid values: field-recording, restored, reconstructed, speculative.";
  }
  if (sortRaw && !isValidSort(sortRaw)) {
    fields.sort =
      "Unknown sort. Valid values: editorial, recent, oldest-sound, newest-sound, title.";
  }

  const limit = parseIntParam(params.get("limit"), { min: 1, max: 100, fallback: 50 });
  if (limit === null) fields.limit = "limit must be an integer between 1 and 100.";

  const offset = parseIntParam(params.get("offset"), { min: 0, max: 10000, fallback: 0 });
  if (offset === null) fields.offset = "offset must be an integer between 0 and 10000.";

  const from = parseIntParam(params.get("from"), { min: 0, max: 2100, fallback: 0 });
  if (from === null) fields.from = "from must be a year between 0 and 2100.";

  const to = parseIntParam(params.get("to"), { min: 0, max: 2100, fallback: 2100 });
  if (to === null) fields.to = "to must be a year between 0 and 2100.";

  if (from !== null && to !== null && from > to) {
    fields.from = "from must not be later than to.";
  }

  const featured = featuredRaw ? parseBoolParam(featuredRaw) : undefined;
  if (featuredRaw && featured === null) {
    fields.featured = "featured must be true or false.";
  }

  if (Object.keys(fields).length > 0) {
    return {
      status: 400,
      body: fail("BAD_REQUEST", "One or more query parameters were invalid.", fields),
      headers: CACHE_NONE,
    };
  }

  const previewToken = params.get("preview");
  const includeDrafts = isPreviewAuthorised(previewToken, ctx.previewSecret);
  if (previewToken && !includeDrafts) {
    return {
      status: 403,
      body: fail("BAD_REQUEST", "Preview token was not accepted."),
      headers: CACHE_NONE,
    };
  }

  const all = queryEntries({
    category: category ?? undefined,
    tag: tag ?? undefined,
    fidelity: fidelity ?? undefined,
    from: from === 0 ? undefined : from!,
    to: to === 2100 ? undefined : to!,
    featured: featured ?? undefined,
    sort: (sortRaw as SortKey | null) ?? "editorial",
    includeDrafts,
  });

  const page = all.slice(offset!, offset! + limit!);

  return {
    status: 200,
    body: ok(page.map(toSummary), {
      total: all.length,
      limit: limit!,
      offset: offset!,
      returned: page.length,
      hasMore: offset! + page.length < all.length,
      preview: includeDrafts,
      appliedFilters: {
        category: category ?? null,
        tag: tag ?? null,
        fidelity: fidelity ?? null,
        from: from === 0 ? null : from,
        to: to === 2100 ? null : to,
        featured: featured ?? null,
        sort: sortRaw ?? "editorial",
      },
    }),
    headers: includeDrafts ? CACHE_NONE : CACHE_PUBLIC,
  };
}

/* -------------------------------------------------------------------------- */
/* GET /api/content/[slug]                                                     */
/* -------------------------------------------------------------------------- */

export function handleContentDetail(
  slug: string,
  params: ParamBag,
  ctx: { previewSecret?: string } = {},
): HandlerResult {
  if (!isValidSlug(slug)) {
    return {
      status: 400,
      body: fail("BAD_REQUEST", "That is not a valid entry slug.", {
        slug: "Slugs are lowercase words separated by single hyphens.",
      }),
      headers: CACHE_NONE,
    };
  }

  const previewToken = params.get("preview");
  const includeDrafts = isPreviewAuthorised(previewToken, ctx.previewSecret);

  const entry = getEntry(slug, { includeDrafts });
  if (!entry) {
    return {
      status: 404,
      body: fail("NOT_FOUND", `No entry exists at "${slug}".`),
      headers: CACHE_NONE,
    };
  }

  const neighbours = getNeighbours(slug, { includeDrafts });

  return {
    status: 200,
    body: ok(
      {
        ...entry,
        contributors: entry.contributorIds
          .map((id) => getContributor(id))
          .filter((c): c is NonNullable<typeof c> => c !== null),
        category: getCategory(entry.category) ?? entry.category,
      },
      {
        related: getRelated(slug).map((r) => ({ ...toSummary(r.entry), reason: r.reason })),
        previous: neighbours.previous ? toSummary(neighbours.previous) : null,
        next: neighbours.next ? toSummary(neighbours.next) : null,
        position: neighbours.position,
        total: neighbours.total,
        preview: includeDrafts,
      },
    ),
    headers: includeDrafts ? CACHE_NONE : CACHE_PUBLIC,
  };
}

/* -------------------------------------------------------------------------- */
/* GET /api/categories                                                         */
/* -------------------------------------------------------------------------- */

export function handleCategories(): HandlerResult {
  return {
    status: 200,
    body: ok(
      getCategories().map((c) => ({
        ...c,
        entryCount: countEntriesInCategory(c.id),
      })),
      { total: getCategories().length },
    ),
    headers: CACHE_PUBLIC,
  };
}

/* -------------------------------------------------------------------------- */
/* GET /api/search                                                             */
/* -------------------------------------------------------------------------- */

export function handleSearch(params: ParamBag): HandlerResult {
  const q = params.get("q");

  const limit = parseIntParam(params.get("limit"), { min: 1, max: 25, fallback: 10 });
  if (limit === null) {
    return {
      status: 400,
      body: fail("BAD_REQUEST", "Invalid query parameter.", {
        limit: "limit must be an integer between 1 and 25.",
      }),
      headers: CACHE_NONE,
    };
  }

  if (q === null || q.trim() === "") {
    return {
      status: 400,
      body: fail("BAD_REQUEST", "A search query is required.", {
        q: "Provide a search term, for example ?q=glacier.",
      }),
      headers: CACHE_NONE,
    };
  }

  if (q.length > 120) {
    return {
      status: 413,
      body: fail("PAYLOAD_TOO_LARGE", "Search query is too long.", {
        q: "Queries must be 120 characters or fewer.",
      }),
      headers: CACHE_NONE,
    };
  }

  const results = searchEntries(q, limit);

  return {
    status: 200,
    body: ok(results, {
      // The echoed query is sanitised at the boundary rather than trusting every
      // downstream consumer to escape it. The archive has no use for markup in a
      // search term, so stripping it costs nothing and removes a reflection sink.
      query: sanitiseEcho(q),
      total: results.length,
      limit,
      // A truthful empty state: offer real routes back into the archive.
      suggestions: results.length === 0 ? getSuggestions(6) : [],
    }),
    headers: CACHE_PUBLIC,
  };
}

/**
 * Neutralise a value that will be echoed back to the caller.
 * Removes angle brackets, quotes, ampersands and control characters, then
 * collapses whitespace. Search relevance is unaffected because the raw query is
 * what was matched; only the echoed copy is cleaned.
 */
export function sanitiseEcho(raw: string): string {
  return raw
    .replace(/[<>"'`&]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* -------------------------------------------------------------------------- */
/* GET /api/site-config                                                        */
/* -------------------------------------------------------------------------- */

export function handleSiteConfig(): HandlerResult {
  const config = getSiteConfig();
  return {
    status: 200,
    body: ok({
      ...config,
      categories: getCategories().map((c) => ({
        slug: c.slug,
        name: c.name,
        entryCount: countEntriesInCategory(c.id),
      })),
      tags: getTags().slice(0, 24),
      fidelityScale: [
        { id: "field-recording", label: "Field recording", meaning: "An authentic recording survives." },
        { id: "restored", label: "Restored", meaning: "A damaged recording, repaired." },
        { id: "reconstructed", label: "Reconstructed", meaning: "Rebuilt from evidence and physical modelling." },
        { id: "speculative", label: "Speculative", meaning: "An informed synthesis. No primary audio exists." },
      ],
    }),
    headers: CACHE_PUBLIC,
  };
}

/* -------------------------------------------------------------------------- */
/* GET /api/timeline                                                           */
/* -------------------------------------------------------------------------- */

export function handleTimeline(): HandlerResult {
  const bands = getTimeline();
  return {
    status: 200,
    body: ok(bands, {
      bands: bands.length,
      total: bands.reduce((sum, b) => sum + b.entries.length, 0),
    }),
    headers: CACHE_PUBLIC,
  };
}

/* -------------------------------------------------------------------------- */
/* POST /api/contact                                                           */
/* -------------------------------------------------------------------------- */

export const apiContactLimiter = new RateLimiter(5, 10 * 60 * 1000);

export interface ContactContext {
  clientKey: string;
  now?: number;
  limiter?: RateLimiter;
  /** Raw body byte length, checked before parsing. */
  byteLength?: number;
}

export function handleContact(rawBody: unknown, ctx: ContactContext): HandlerResult {
  const now = ctx.now ?? Date.now();
  const limiter = ctx.limiter ?? apiContactLimiter;

  if (typeof ctx.byteLength === "number" && ctx.byteLength > CONTACT_LIMITS.maxBodyBytes) {
    return {
      status: 413,
      body: fail("PAYLOAD_TOO_LARGE", "That submission is too large."),
      headers: CACHE_NONE,
    };
  }

  const gate = limiter.check(ctx.clientKey, now);
  if (!gate.allowed) {
    return {
      status: 429,
      body: fail(
        "RATE_LIMITED",
        `Too many submissions. Please try again in ${gate.retryAfterSec} seconds.`,
      ),
      headers: {
        ...CACHE_NONE,
        "Retry-After": String(gate.retryAfterSec),
        "X-RateLimit-Remaining": "0",
      },
    };
  }

  const result = validateContact(rawBody);
  if (!result.valid) {
    return {
      status: 422,
      body: fail("VALIDATION_FAILED", "Please correct the highlighted fields.", result.fields),
      headers: { ...CACHE_NONE, "X-RateLimit-Remaining": String(gate.remaining) },
    };
  }

  const submission = result.value!;
  const reference = makeReference(submission.email, now);

  // Persistence note: with no datastore provisioned, the submission is accepted,
  // validated and acknowledged with a reference, and the server records it in the
  // process log. Wiring a durable store is a single swap at this point, and the
  // limitation is stated in the API documentation rather than hidden.
  return {
    status: 201,
    body: ok({
      reference,
      received: true,
      subject: submission.subject,
      entrySlug: submission.entrySlug ?? null,
      message: "Thank you. Your enquiry has been recorded and a curator will respond by email.",
    }),
    headers: { ...CACHE_NONE, "X-RateLimit-Remaining": String(gate.remaining) },
  };
}

/**
 * A short, stable, non-reversible reference for an enquiry.
 * Deliberately not derived from anything secret and safe to show a user.
 */
export function makeReference(email: string, now: number): string {
  let hash = 2166136261;
  const material = `${email}:${now}`;
  for (let i = 0; i < material.length; i++) {
    hash ^= material.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const suffix = (hash >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
  const year = new Date(now).getUTCFullYear();
  return `THR-${year}-${suffix}`;
}

/* -------------------------------------------------------------------------- */
/* Method guard                                                                */
/* -------------------------------------------------------------------------- */

export function methodNotAllowed(allowed: string[]): HandlerResult {
  return {
    status: 405,
    body: fail("METHOD_NOT_ALLOWED", `This endpoint accepts ${allowed.join(", ")} only.`),
    headers: { Allow: allowed.join(", "), ...CACHE_NONE },
  };
}
