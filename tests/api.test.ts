import test from "node:test";
import assert from "node:assert/strict";

import {
  apiContactLimiter,
  handleCategories,
  handleContact,
  handleContentDetail,
  handleContentList,
  handleHealth,
  handleSearch,
  handleSiteConfig,
  handleTimeline,
  isPreviewAuthorised,
  makeReference,
  methodNotAllowed,
  toSummary,
} from "../src/lib/api-core.ts";
import { getEntries, getEntry } from "../src/lib/repository.ts";
import { RateLimiter } from "../src/lib/validation.ts";

/** Minimal stand-in for URLSearchParams-shaped input. */
function params(init: Record<string, string> = {}) {
  const map = new Map(Object.entries(init));
  return { get: (name: string) => (map.has(name) ? map.get(name)! : null) };
}

function expectOk<T>(result: { status: number; body: unknown }): {
  data: T;
  meta: Record<string, unknown>;
} {
  const body = result.body as { ok: boolean; data: T; meta?: Record<string, unknown>; error?: unknown };
  assert.equal(body.ok, true, `expected ok envelope, got ${JSON.stringify(body.error)}`);
  return { data: body.data, meta: body.meta ?? {} };
}

function expectFail(result: { status: number; body: unknown }) {
  const body = result.body as {
    ok: boolean;
    error: { code: string; message: string; fields?: Record<string, string> };
  };
  assert.equal(body.ok, false, "expected failure envelope");
  assert.ok(body.error.code.length > 0, "error code must be present");
  assert.ok(body.error.message.length > 0, "error message must be present");
  return body.error;
}

/* -------------------------------------------------------------------------- */

test("GET /api/health reports healthy with real counts", () => {
  const res = handleHealth();
  assert.equal(res.status, 200);
  const { data } = expectOk<{
    status: string;
    checks: Record<string, boolean>;
    entries: number;
    categories: number;
    uptimeSeconds: number;
    timestamp: string;
  }>(res);

  assert.equal(data.status, "healthy");
  assert.equal(Object.values(data.checks).every(Boolean), true);
  assert.ok(data.entries >= 12, "health must report the real entry count");
  assert.equal(data.categories, 6);
  assert.ok(data.uptimeSeconds >= 0);
  assert.ok(!Number.isNaN(Date.parse(data.timestamp)));
  assert.equal(res.headers?.["Cache-Control"], "no-store");
});

test("health response leaks no secrets", () => {
  const serialised = JSON.stringify(handleHealth().body);
  for (const forbidden of ["TOKEN", "SECRET", "KEY", "PASSWORD", "vcp_"]) {
    assert.equal(
      serialised.toUpperCase().includes(forbidden.toUpperCase()),
      false,
      `health output must not contain ${forbidden}`,
    );
  }
});

/* -------------------------------------------------------------------------- */

test("GET /api/content returns published summaries only", () => {
  const res = handleContentList(params());
  assert.equal(res.status, 200);
  const { data, meta } = expectOk<Array<Record<string, unknown>>>(res);

  assert.ok(data.length > 0);
  assert.equal(
    data.every((e) => e.status === "published"),
    true,
    "drafts must never appear without preview",
  );
  assert.equal(meta.preview, false);
  assert.equal(meta.total, data.length);
  // Summaries are projections, not whole entries.
  assert.equal("body" in data[0]!, false, "list endpoint must not ship body blocks");
  assert.equal("sources" in data[0]!, false);
});

test("GET /api/content paginates truthfully", () => {
  const all = expectOk<unknown[]>(handleContentList(params())).data;
  const page = handleContentList(params({ limit: "3", offset: "0" }));
  const { data, meta } = expectOk<unknown[]>(page);

  assert.equal(data.length, 3);
  assert.equal(meta.total, all.length);
  assert.equal(meta.returned, 3);
  assert.equal(meta.hasMore, all.length > 3);

  const last = handleContentList(params({ limit: "3", offset: String(all.length) }));
  const lastBody = expectOk<unknown[]>(last);
  assert.equal(lastBody.data.length, 0);
  assert.equal(lastBody.meta.hasMore, false);
});

test("GET /api/content rejects each invalid parameter with a named field", () => {
  const cases: Array<[Record<string, string>, string]> = [
    [{ category: "not-a-category" }, "category"],
    [{ fidelity: "imaginary" }, "fidelity"],
    [{ sort: "sideways" }, "sort"],
    [{ limit: "0" }, "limit"],
    [{ limit: "9999" }, "limit"],
    [{ limit: "abc" }, "limit"],
    [{ offset: "-1" }, "offset"],
    [{ featured: "maybe" }, "featured"],
    [{ from: "1900", to: "1800" }, "from"],
  ];

  for (const [query, field] of cases) {
    const res = handleContentList(params(query));
    assert.equal(res.status, 400, `${JSON.stringify(query)} should be a 400`);
    const error = expectFail(res);
    assert.equal(error.code, "BAD_REQUEST");
    assert.ok(error.fields?.[field], `expected a field error on "${field}"`);
  }
});

test("GET /api/content filters and reports what it applied", () => {
  const res = handleContentList(params({ category: "extinct-voices", sort: "title" }));
  const { data, meta } = expectOk<Array<{ category: string; title: string }>>(res);

  assert.ok(data.length > 0, "extinct-voices must contain entries");
  assert.equal(
    data.every((e) => e.category === "extinct-voices"),
    true,
  );
  const titles = data.map((e) => e.title);
  assert.deepEqual(titles, [...titles].sort((a, b) => a.localeCompare(b)));

  const applied = meta.appliedFilters as Record<string, unknown>;
  assert.equal(applied.category, "extinct-voices");
  assert.equal(applied.sort, "title");
  assert.equal(applied.tag, null);
});

test("GET /api/content year range filtering is inclusive", () => {
  const res = handleContentList(params({ from: "1970", to: "1990" }));
  const { data } = expectOk<Array<{ lastHeard: number }>>(res);
  assert.equal(
    data.every((e) => e.lastHeard >= 1970 && e.lastHeard <= 1990),
    true,
  );
});

test("GET /api/content preview requires the server secret", () => {
  const secret = "test-preview-secret";

  const noToken = handleContentList(params(), { previewSecret: secret });
  assert.equal(expectOk<unknown[]>(noToken).meta.preview, false);

  const wrong = handleContentList(params({ preview: "guessed-token" }), { previewSecret: secret });
  assert.equal(wrong.status, 403);
  expectFail(wrong);

  const right = handleContentList(params({ preview: secret }), { previewSecret: secret });
  const { data, meta } = expectOk<Array<{ status: string }>>(right);
  assert.equal(meta.preview, true);
  assert.ok(
    data.some((e) => e.status === "draft"),
    "preview mode must reveal drafts",
  );
  assert.equal(right.headers?.["Cache-Control"], "no-store");
});

test("preview token comparison rejects prefixes and empty secrets", () => {
  assert.equal(isPreviewAuthorised("abc", "abc"), true);
  assert.equal(isPreviewAuthorised("abc", "abcd"), false);
  assert.equal(isPreviewAuthorised("abcd", "abc"), false);
  assert.equal(isPreviewAuthorised("", ""), false);
  assert.equal(isPreviewAuthorised("abc", undefined), false);
  assert.equal(isPreviewAuthorised(null, "abc"), false);
});

/* -------------------------------------------------------------------------- */

test("GET /api/content/[slug] returns a full entry with navigation", () => {
  const first = getEntries()[0]!;
  const res = handleContentDetail(first.slug, params());
  assert.equal(res.status, 200);

  const { data, meta } = expectOk<Record<string, unknown>>(res);
  assert.equal(data.slug, first.slug);
  assert.ok(Array.isArray(data.body), "detail must include body blocks");
  assert.ok(Array.isArray(data.contributors));
  assert.ok((data.contributors as unknown[]).length > 0, "contributors must resolve");
  assert.equal(typeof (data.category as { name: string }).name, "string");

  assert.ok(Array.isArray(meta.related));
  assert.equal((meta.related as unknown[]).length > 0, true);
  assert.ok(meta.previous, "previous neighbour must exist");
  assert.ok(meta.next, "next neighbour must exist");
  assert.equal(meta.position, 1);
});

test("every published entry is reachable by direct slug lookup", () => {
  for (const entry of getEntries()) {
    const res = handleContentDetail(entry.slug, params());
    assert.equal(res.status, 200, `${entry.slug} must resolve directly`);
  }
});

test("GET /api/content/[slug] 404s for a missing record", () => {
  const res = handleContentDetail("a-sound-never-recorded", params());
  assert.equal(res.status, 404);
  const error = expectFail(res);
  assert.equal(error.code, "NOT_FOUND");
  assert.ok(error.message.includes("a-sound-never-recorded"));
});

test("GET /api/content/[slug] 400s for a malformed slug", () => {
  for (const bad of ["../../etc/passwd", "Not A Slug", "double--hyphen", "-leading", "trailing-"]) {
    const res = handleContentDetail(bad, params());
    assert.equal(res.status, 400, `${bad} must be rejected`);
    assert.equal(expectFail(res).code, "BAD_REQUEST");
  }
});

test("draft entries 404 publicly and resolve under preview", () => {
  const draft = getEntries().length;
  const drafts = [...Array(0)];
  void drafts;
  void draft;

  const draftEntry = getEntry("glacier-calving-ok", { includeDrafts: true });
  assert.ok(draftEntry, "fixture draft must exist");
  assert.equal(draftEntry!.status, "draft");

  const publicRes = handleContentDetail("glacier-calving-ok", params());
  assert.equal(publicRes.status, 404, "drafts must be invisible publicly");

  const secret = "s3cret";
  const previewRes = handleContentDetail("glacier-calving-ok", params({ preview: secret }), {
    previewSecret: secret,
  });
  assert.equal(previewRes.status, 200);
  assert.equal(expectOk<{ status: string }>(previewRes).data.status, "draft");
});

/* -------------------------------------------------------------------------- */

test("GET /api/categories returns all six with live counts", () => {
  const res = handleCategories();
  const { data, meta } = expectOk<Array<{ slug: string; entryCount: number; name: string }>>(res);

  assert.equal(data.length, 6);
  assert.equal(meta.total, 6);
  const totalled = data.reduce((sum, c) => sum + c.entryCount, 0);
  assert.equal(totalled, getEntries().length, "counts must sum to the published archive");
  assert.equal(
    data.every((c) => c.name.length > 0 && c.slug.length > 0),
    true,
  );
});

/* -------------------------------------------------------------------------- */

test("GET /api/search requires a query", () => {
  for (const q of [undefined, "", "   "]) {
    const res = handleSearch(q === undefined ? params() : params({ q }));
    assert.equal(res.status, 400);
    assert.ok(expectFail(res).fields?.q);
  }
});

test("GET /api/search returns ranked hits", () => {
  const res = handleSearch(params({ q: "forest" }));
  assert.equal(res.status, 200);
  const { data, meta } = expectOk<Array<{ slug: string; score: number }>>(res);
  assert.ok(data.length > 0, "a known term must return hits");
  for (let i = 1; i < data.length; i++) {
    assert.ok(data[i - 1]!.score >= data[i]!.score, "hits must be ordered by score");
  }
  assert.equal(meta.query, "forest");
  // A term that appears only in a draft entry must not leak through public search.
  assert.equal(expectOk<unknown[]>(handleSearch(params({ q: "glacier" }))).data.length, 0);
});

test("GET /api/search returns a helpful empty state", () => {
  const res = handleSearch(params({ q: "zzzzqqqqxxxx" }));
  assert.equal(res.status, 200, "no results is not an error");
  const { data, meta } = expectOk<unknown[]>(res);
  assert.equal(data.length, 0);
  const suggestions = meta.suggestions as string[];
  assert.ok(suggestions.length > 0, "empty search must offer a route back in");
});

test("GET /api/search caps and validates limits", () => {
  const bad = handleSearch(params({ q: "sound", limit: "500" }));
  assert.equal(bad.status, 400);
  assert.ok(expectFail(bad).fields?.limit);

  const capped = handleSearch(params({ q: "a", limit: "2" }));
  assert.ok(expectOk<unknown[]>(capped).data.length <= 2);

  const tooLong = handleSearch(params({ q: "x".repeat(200) }));
  assert.equal(tooLong.status, 413);
  assert.equal(expectFail(tooLong).code, "PAYLOAD_TOO_LARGE");
});

test("search does not reflect unescaped markup", () => {
  const res = handleSearch(params({ q: '<img src=x onerror="alert(1)">' }));
  assert.equal(res.status, 200);
  const meta = (res.body as { meta: { query: string } }).meta;
  // The echoed query must contain no character capable of breaking out of an
  // HTML text node or an attribute value.
  for (const dangerous of ["<", ">", '"', "'", "`", "&"]) {
    assert.equal(
      meta.query.includes(dangerous),
      false,
      `echoed query must not contain ${dangerous}`,
    );
  }
  assert.equal(meta.query, "img src=x onerror=alert(1)");
});

test("empty-state suggestions are useful, not bare years", () => {
  const res = handleSearch(params({ q: "zzzzqqqqxxxx" }));
  const suggestions = expectOk<unknown[]>(res).meta.suggestions as string[];
  assert.ok(suggestions.length >= 6);
  for (const s of suggestions) {
    assert.equal(/^\d{4}s?$/.test(s), false, `"${s}" is a bare year, not a subject`);
  }
  // Every suggestion must lead somewhere. No suggestion may cause a second
  // empty state.
  for (const s of suggestions) {
    const followUp = handleSearch(params({ q: s }));
    assert.ok(
      expectOk<unknown[]>(followUp).data.length > 0,
      `suggestion "${s}" must return results`,
    );
  }
});

/* -------------------------------------------------------------------------- */

test("GET /api/site-config exposes public configuration only", () => {
  const res = handleSiteConfig();
  const { data } = expectOk<Record<string, unknown>>(res);

  assert.equal(typeof data.name, "string");
  assert.ok(Array.isArray(data.categories));
  assert.equal((data.categories as unknown[]).length, 6);
  assert.ok(Array.isArray(data.tags));
  assert.equal((data.fidelityScale as unknown[]).length, 4);
  assert.deepEqual(data.locales, ["en", "fr"]);

  const serialised = JSON.stringify(data).toLowerCase();
  for (const forbidden of ["secret", "token", "apikey", "password", "vcp_"]) {
    assert.equal(serialised.includes(forbidden), false, `site-config must not contain ${forbidden}`);
  }
});

test("GET /api/timeline groups every published entry exactly once", () => {
  const res = handleTimeline();
  const { data, meta } = expectOk<Array<{ entries: unknown[] }>>(res);
  assert.ok(data.length > 0);
  assert.equal(meta.total, getEntries().length);
});

/* -------------------------------------------------------------------------- */

const validContact = {
  name: "Ada Morrow",
  email: "ada@example.org",
  subject: "contribute",
  message: "I hold a 1962 reel of the Kauaʻi forest and would like to discuss depositing it.",
};

test("POST /api/contact accepts a valid submission", () => {
  const limiter = new RateLimiter(5, 60_000);
  const res = handleContact(validContact, { clientKey: "1.2.3.4", limiter });
  assert.equal(res.status, 201);
  const { data } = expectOk<{ reference: string; received: boolean }>(res);
  assert.equal(data.received, true);
  assert.match(data.reference, /^THR-\d{4}-[0-9A-Z]{7}$/);
});

test("POST /api/contact reports every field error at once", () => {
  const limiter = new RateLimiter(5, 60_000);
  const res = handleContact(
    { name: "A", email: "not-an-email", subject: "nonsense", message: "too short" },
    { clientKey: "5.6.7.8", limiter },
  );
  assert.equal(res.status, 422);
  const error = expectFail(res);
  assert.equal(error.code, "VALIDATION_FAILED");
  for (const field of ["name", "email", "subject", "message"]) {
    assert.ok(error.fields?.[field], `expected an error for ${field}`);
  }
});

test("POST /api/contact rejects malformed bodies", () => {
  const limiter = new RateLimiter(50, 60_000);
  for (const body of [null, "a string", 42, [], undefined]) {
    const res = handleContact(body, { clientKey: "9.9.9.9", limiter });
    assert.equal(res.status, 422, `${JSON.stringify(body)} must not be accepted`);
    expectFail(res);
  }
});

test("POST /api/contact rejects oversized bodies before parsing", () => {
  const limiter = new RateLimiter(5, 60_000);
  const res = handleContact(validContact, {
    clientKey: "2.2.2.2",
    limiter,
    byteLength: 64 * 1024,
  });
  assert.equal(res.status, 413);
  assert.equal(expectFail(res).code, "PAYLOAD_TOO_LARGE");
});

test("POST /api/contact rate limits per client and sets Retry-After", () => {
  const limiter = new RateLimiter(3, 60_000);
  const key = "10.0.0.1";
  const now = 1_000_000;

  for (let i = 0; i < 3; i++) {
    const res = handleContact(validContact, { clientKey: key, limiter, now });
    assert.equal(res.status, 201, `submission ${i + 1} should pass`);
  }

  const blocked = handleContact(validContact, { clientKey: key, limiter, now });
  assert.equal(blocked.status, 429);
  assert.equal(expectFail(blocked).code, "RATE_LIMITED");
  assert.ok(Number(blocked.headers?.["Retry-After"]) > 0);

  // A different client is unaffected.
  const other = handleContact(validContact, { clientKey: "10.0.0.2", limiter, now });
  assert.equal(other.status, 201);

  // The window expires.
  const later = handleContact(validContact, { clientKey: key, limiter, now: now + 61_000 });
  assert.equal(later.status, 201);
});

test("contact references are unique per submission and reveal nothing", () => {
  const a = makeReference("ada@example.org", 1_700_000_000_000);
  const b = makeReference("ada@example.org", 1_700_000_000_001);
  assert.notEqual(a, b);
  assert.equal(a.includes("ada"), false);
  assert.equal(a.includes("@"), false);
});

test("shared contact limiter is exported and resettable", () => {
  apiContactLimiter.reset();
  const res = handleContact(validContact, { clientKey: "3.3.3.3" });
  assert.equal(res.status, 201);
  apiContactLimiter.reset();
});

/* -------------------------------------------------------------------------- */

test("wrong methods return 405 with an Allow header", () => {
  const res = methodNotAllowed(["GET"]);
  assert.equal(res.status, 405);
  assert.equal(res.headers?.Allow, "GET");
  assert.equal(expectFail(res).code, "METHOD_NOT_ALLOWED");
});

test("read endpoints declare a cache policy, mutations do not cache", () => {
  assert.match(handleCategories().headers!["Cache-Control"]!, /s-maxage=\d+/);
  assert.match(handleSiteConfig().headers!["Cache-Control"]!, /s-maxage=\d+/);
  assert.match(handleContentList(params()).headers!["Cache-Control"]!, /s-maxage=\d+/);
  assert.equal(handleHealth().headers!["Cache-Control"], "no-store");
  const limiter = new RateLimiter(5, 60_000);
  assert.equal(
    handleContact(validContact, { clientKey: "4.4.4.4", limiter }).headers!["Cache-Control"],
    "no-store",
  );
});

test("every summary projection is complete and typed", () => {
  for (const entry of getEntries()) {
    const summary = toSummary(entry);
    assert.equal(typeof summary.slug, "string");
    assert.equal(typeof summary.title, "string");
    assert.equal(typeof summary.description, "string");
    assert.equal(typeof summary.lastHeard, "number");
    assert.equal(typeof summary.lat, "number");
    assert.equal(typeof summary.lon, "number");
    assert.ok(summary.lat >= -90 && summary.lat <= 90, `${summary.slug} latitude in range`);
    assert.ok(summary.lon >= -180 && summary.lon <= 180, `${summary.slug} longitude in range`);
    assert.ok(summary.readingMinutes > 0);
  }
});

test("no endpoint ever returns an envelope without ok", () => {
  const results = [
    handleHealth(),
    handleContentList(params()),
    handleContentList(params({ limit: "bad" })),
    handleContentDetail("nope-nope", params()),
    handleCategories(),
    handleSearch(params({ q: "ice" })),
    handleSearch(params()),
    handleSiteConfig(),
    handleTimeline(),
    methodNotAllowed(["GET"]),
  ];
  for (const res of results) {
    const body = res.body as Record<string, unknown>;
    assert.equal("ok" in body, true, "every response must carry the ok discriminator");
    assert.equal(typeof res.status, "number");
    assert.ok(res.status >= 200 && res.status < 600);
    if (body.ok === false) {
      assert.equal("data" in body, false, "failures must not carry data");
    } else {
      assert.equal("error" in body, false, "successes must not carry error");
    }
  }
});
