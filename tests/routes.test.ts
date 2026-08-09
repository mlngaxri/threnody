import test from "node:test";
import assert from "node:assert/strict";

import { GET as healthGET } from "../src/app/api/health/route.ts";
import { GET as contentGET } from "../src/app/api/content/route.ts";
import { GET as detailGET } from "../src/app/api/content/[slug]/route.ts";
import { GET as categoriesGET } from "../src/app/api/categories/route.ts";
import { GET as searchGET } from "../src/app/api/search/route.ts";
import { GET as configGET } from "../src/app/api/site-config/route.ts";
import { GET as timelineGET } from "../src/app/api/timeline/route.ts";
import {
  POST as contactPOST,
  GET as contactGET,
  PUT as contactPUT,
} from "../src/app/api/contact/route.ts";
import { apiContactLimiter } from "../src/lib/api-core.ts";
import { getEntries } from "../src/lib/repository.ts";

/**
 * These tests execute the real Next.js route handlers as plain functions.
 * Route handlers in the App Router are ordinary (Request) => Response
 * functions, so every one of them can be exercised end to end, including
 * header handling, JSON parsing and status codes, without a running server.
 */

const BASE = "https://threnody.test";

function req(path: string, init?: RequestInit): Request {
  return new Request(`${BASE}${path}`, init);
}

async function readBody(res: Response): Promise<{ ok: boolean; data?: unknown; error?: { code: string; message: string; fields?: Record<string, string> }; meta?: Record<string, unknown> }> {
  return (await res.json()) as never;
}

test("every GET route returns JSON with the correct content type", async () => {
  const cases: Array<[string, Promise<Response>]> = [
    ["health", healthGET()],
    ["content", contentGET(req("/api/content"))],
    ["categories", categoriesGET()],
    ["search", searchGET(req("/api/search?q=forest"))],
    ["site-config", configGET()],
    ["timeline", timelineGET()],
  ];

  for (const [name, promise] of cases) {
    const res = await promise;
    assert.equal(res.status, 200, `${name} must be 200`);
    assert.match(
      res.headers.get("content-type") ?? "",
      /application\/json/,
      `${name} must declare JSON`,
    );
    const body = await readBody(res);
    assert.equal(body.ok, true, `${name} must return an ok envelope`);
  }
});

test("GET /api/health reports healthy and is never cached", async () => {
  const res = await healthGET();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = await readBody(res);
  const data = body.data as { status: string; entries: number };
  assert.equal(data.status, "healthy");
  assert.equal(data.entries, getEntries().length);
});

test("GET /api/content honours query parameters through the real handler", async () => {
  const res = await contentGET(req("/api/content?category=extinct-voices&limit=2"));
  assert.equal(res.status, 200);
  const body = await readBody(res);
  const data = body.data as Array<{ category: string }>;
  assert.ok(data.length <= 2);
  assert.equal(
    data.every((e) => e.category === "extinct-voices"),
    true,
  );
  assert.match(res.headers.get("cache-control") ?? "", /s-maxage=\d+/);
});

test("GET /api/content rejects a bad parameter with 400 and a field error", async () => {
  const res = await contentGET(req("/api/content?limit=nonsense"));
  assert.equal(res.status, 400);
  const body = await readBody(res);
  assert.equal(body.ok, false);
  assert.ok(body.error?.fields?.limit);
});

test("dynamic route resolves a real slug and 404s an unknown one", async () => {
  const slug = getEntries()[0]!.slug;

  const found = await detailGET(req(`/api/content/${slug}`), {
    params: Promise.resolve({ slug }),
  });
  assert.equal(found.status, 200);
  const body = await readBody(found);
  assert.equal((body.data as { slug: string }).slug, slug);
  assert.ok(body.meta?.related);

  const missing = await detailGET(req("/api/content/no-such-sound"), {
    params: Promise.resolve({ slug: "no-such-sound" }),
  });
  assert.equal(missing.status, 404);
  assert.equal((await readBody(missing)).error?.code, "NOT_FOUND");
});

test("dynamic route rejects path traversal in the slug", async () => {
  const res = await detailGET(req("/api/content/x"), {
    params: Promise.resolve({ slug: "../../etc/passwd" }),
  });
  assert.equal(res.status, 400);
});

test("preview is unauthorised when PREVIEW_SECRET is unset", async () => {
  const previous = process.env.PREVIEW_SECRET;
  delete process.env.PREVIEW_SECRET;
  try {
    const res = await contentGET(req("/api/content?preview=anything"));
    assert.equal(res.status, 403, "a preview attempt with no configured secret must be refused");
  } finally {
    if (previous !== undefined) process.env.PREVIEW_SECRET = previous;
  }
});

test("preview succeeds when the environment secret matches", async () => {
  const previous = process.env.PREVIEW_SECRET;
  process.env.PREVIEW_SECRET = "unit-test-preview";
  try {
    const res = await contentGET(req("/api/content?preview=unit-test-preview"));
    assert.equal(res.status, 200);
    const body = await readBody(res);
    assert.equal(body.meta?.preview, true);
    const data = body.data as Array<{ status: string }>;
    assert.ok(data.some((e) => e.status === "draft"));
  } finally {
    if (previous === undefined) delete process.env.PREVIEW_SECRET;
    else process.env.PREVIEW_SECRET = previous;
  }
});

test("GET /api/search validates and returns results", async () => {
  const missing = await searchGET(req("/api/search"));
  assert.equal(missing.status, 400);

  const found = await searchGET(req("/api/search?q=forest"));
  assert.equal(found.status, 200);
  const body = await readBody(found);
  assert.ok((body.data as unknown[]).length > 0);
});

test("search handles URL encoded and unicode queries", async () => {
  const res = await searchGET(req(`/api/search?q=${encodeURIComponent("Kauaʻi")}`));
  assert.equal(res.status, 200);
  assert.ok((await readBody(res)).data);
});

test("POST /api/contact accepts a valid submission through the real handler", async () => {
  apiContactLimiter.reset();
  const res = await contactPOST(
    req("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.7" },
      body: JSON.stringify({
        name: "Signe Halvorsen",
        email: "signe@example.org",
        subject: "correction",
        message: "The 1975 shoreline coordinates look transposed. I have the original field notes.",
      }),
    }),
  );
  assert.equal(res.status, 201);
  const body = await readBody(res);
  assert.match((body.data as { reference: string }).reference, /^THR-\d{4}-[0-9A-Z]{7}$/);
  apiContactLimiter.reset();
});

test("POST /api/contact returns 400 for malformed JSON, not a crash", async () => {
  apiContactLimiter.reset();
  for (const bad of ["{not json", "", "[1,2,3"]) {
    const res = await contactPOST(
      req("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.9" },
        body: bad,
      }),
    );
    assert.equal(res.status, 400, `body ${JSON.stringify(bad)} must be a clean 400`);
    assert.equal((await readBody(res)).error?.code, "BAD_REQUEST");
  }
  apiContactLimiter.reset();
});

test("POST /api/contact returns 422 with named fields for invalid input", async () => {
  apiContactLimiter.reset();
  const res = await contactPOST(
    req("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.11" },
      body: JSON.stringify({ name: "", email: "nope", subject: "wrong", message: "short" }),
    }),
  );
  assert.equal(res.status, 422);
  const body = await readBody(res);
  assert.ok(body.error?.fields?.email);
  assert.ok(body.error?.fields?.message);
  apiContactLimiter.reset();
});

test("contact rate limiting is enforced at the route boundary", async () => {
  apiContactLimiter.reset();
  const headers = { "content-type": "application/json", "x-forwarded-for": "203.0.113.55" };
  const payload = JSON.stringify({
    name: "Tomas Brandt",
    email: "tomas@example.org",
    subject: "general",
    message: "A question about how the reconstruction confidence bands are calculated.",
  });

  let lastStatus = 0;
  for (let i = 0; i < 7; i++) {
    const res = await contactPOST(req("/api/contact", { method: "POST", headers, body: payload }));
    lastStatus = res.status;
    if (res.status === 429) {
      assert.ok(Number(res.headers.get("retry-after")) > 0, "429 must carry Retry-After");
      break;
    }
  }
  assert.equal(lastStatus, 429, "the limiter must eventually refuse");
  apiContactLimiter.reset();
});

test("wrong methods on /api/contact return JSON 405 with Allow", async () => {
  for (const handler of [contactGET, contactPUT]) {
    const res = await handler();
    assert.equal(res.status, 405);
    assert.equal(res.headers.get("allow"), "POST");
    assert.equal((await readBody(res)).error?.code, "METHOD_NOT_ALLOWED");
  }
});

test("no route response body contains a secret-looking value", async () => {
  const responses = await Promise.all([
    healthGET(),
    contentGET(req("/api/content")),
    categoriesGET(),
    searchGET(req("/api/search?q=ice")),
    configGET(),
    timelineGET(),
  ]);

  for (const res of responses) {
    const text = await res.text();
    for (const pattern of [/vcp_[A-Za-z0-9]/, /"secret"/i, /api[_-]?key/i, /bearer /i]) {
      assert.equal(pattern.test(text), false, `response leaked something matching ${pattern}`);
    }
  }
});

test("every route sets a deliberate cache policy", async () => {
  const cached: Array<[string, Response]> = [
    ["content", await contentGET(req("/api/content"))],
    ["categories", await categoriesGET()],
    ["site-config", await configGET()],
    ["timeline", await timelineGET()],
    ["search", await searchGET(req("/api/search?q=ice"))],
  ];
  for (const [name, res] of cached) {
    assert.match(
      res.headers.get("cache-control") ?? "",
      /s-maxage=\d+/,
      `${name} should be edge cacheable`,
    );
  }
  assert.equal((await healthGET()).headers.get("cache-control"), "no-store");
});
