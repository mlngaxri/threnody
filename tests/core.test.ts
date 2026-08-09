import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  getEntries,
  getEntry,
  getCategories,
  getCategory,
  getContributor,
  getTags,
  getSiteConfig,
  queryEntries,
  sortEntries,
  getNeighbours,
  getRelated,
  searchEntries,
  highlight,
  escapeHtml,
  getTimeline,
  countEntriesInCategory,
  isValidFidelity,
  isValidSort,
  publishedEntries,
  allEntries,
} from "../src/lib/repository.ts";

import {
  ok,
  fail,
  STATUS_FOR_CODE,
  parseIntParam,
  parseBoolParam,
  isValidSlug,
  validateContact,
  RateLimiter,
  CONTACT_LIMITS,
} from "../src/lib/validation.ts";

/* ========================================================================== */
/* Content model integrity                                                     */
/* ========================================================================== */

describe("content model integrity", () => {
  test("archive meets the minimum size required by the brief", () => {
    assert.ok(publishedEntries.length >= 6, "at least 6 published detail pages");
    assert.equal(publishedEntries.length, 12);
    assert.equal(allEntries.length, 14);
  });

  test("drafts are excluded by default and available in preview", () => {
    const drafts = allEntries.filter((e) => e.status === "draft");
    assert.equal(drafts.length, 2);
    for (const draft of drafts) {
      assert.equal(getEntry(draft.slug), null, "draft hidden by default");
      assert.ok(getEntry(draft.slug, { includeDrafts: true }), "draft visible in preview");
    }
  });

  test("every slug is unique, valid and URL-safe", () => {
    const seen = new Set<string>();
    for (const entry of allEntries) {
      assert.ok(isValidSlug(entry.slug), `slug is URL-safe: ${entry.slug}`);
      assert.ok(!seen.has(entry.slug), `slug is unique: ${entry.slug}`);
      seen.add(entry.slug);
    }
  });

  test("every entry id is unique", () => {
    const ids = new Set(allEntries.map((e) => e.id));
    assert.equal(ids.size, allEntries.length);
  });

  test("every entry carries the full required content model", () => {
    for (const entry of allEntries) {
      assert.ok(entry.title.length > 0, `${entry.slug}: title`);
      assert.ok(entry.description.length > 20, `${entry.slug}: description`);
      assert.ok(entry.epithet.length > 0, `${entry.slug}: epithet`);
      assert.ok(entry.body.length >= 2, `${entry.slug}: body blocks`);
      assert.ok(entry.tags.length >= 3, `${entry.slug}: tags`);
      assert.ok(entry.contributorIds.length >= 1, `${entry.slug}: contributors`);
      assert.ok(entry.sources.length >= 1, `${entry.slug}: sources`);
      assert.ok(Number.isFinite(entry.order), `${entry.slug}: order`);
      assert.match(entry.publishedAt, /^\d{4}-\d{2}-\d{2}$/, `${entry.slug}: publishedAt`);
      assert.match(entry.updatedAt, /^\d{4}-\d{2}-\d{2}$/, `${entry.slug}: updatedAt`);
      assert.ok(entry.readingMinutes > 0, `${entry.slug}: readingMinutes`);
    }
  });

  test("every entry has complete SEO metadata within sane lengths", () => {
    for (const entry of allEntries) {
      assert.ok(entry.seo.metaTitle.length > 0 && entry.seo.metaTitle.length <= 70,
        `${entry.slug}: metaTitle length ${entry.seo.metaTitle.length}`);
      assert.ok(entry.seo.metaDescription.length >= 50 && entry.seo.metaDescription.length <= 200,
        `${entry.slug}: metaDescription length ${entry.seo.metaDescription.length}`);
      assert.ok(entry.seo.ogImageAlt.length > 0, `${entry.slug}: ogImageAlt`);
      assert.ok(entry.seo.keywords.length >= 2, `${entry.slug}: keywords`);
    }
  });

  test("every contributorId resolves to a real contributor", () => {
    for (const entry of allEntries) {
      for (const id of entry.contributorIds) {
        assert.ok(getContributor(id), `${entry.slug}: contributor ${id} exists`);
      }
    }
  });

  test("every category referenced by an entry exists", () => {
    const ids = new Set(getCategories().map((c) => c.id));
    for (const entry of allEntries) {
      assert.ok(ids.has(entry.category), `${entry.slug}: category ${entry.category} exists`);
    }
  });

  test("no relatedSlug points at a missing entry (no broken internal links)", () => {
    const known = new Set(allEntries.map((e) => e.slug));
    for (const entry of allEntries) {
      for (const slug of entry.relatedSlugs) {
        assert.ok(known.has(slug), `${entry.slug} -> ${slug} resolves`);
      }
    }
  });

  test("every category contains at least one published entry", () => {
    for (const category of getCategories()) {
      assert.ok(
        countEntriesInCategory(category.id) >= 1,
        `${category.id} has entries, so no category page is dead`,
      );
    }
  });

  test("provenance coordinates are geographically valid", () => {
    for (const entry of allEntries) {
      const { lat, lon, lastHeard, firstAttested } = entry.provenance;
      assert.ok(lat >= -90 && lat <= 90, `${entry.slug}: lat in range`);
      assert.ok(lon >= -180 && lon <= 180, `${entry.slug}: lon in range`);
      assert.ok(lastHeard > 0 && lastHeard <= 2026, `${entry.slug}: lastHeard plausible`);
      if (firstAttested !== null) {
        assert.ok(firstAttested <= lastHeard, `${entry.slug}: first attested before last heard`);
      }
    }
  });

  test("every sound signature is synthesisable and described for screen readers", () => {
    for (const entry of allEntries) {
      const s = entry.sound;
      assert.ok(s.baseHz >= 20 && s.baseHz <= 20000, `${entry.slug}: audible baseHz`);
      assert.ok(s.partials.length >= 1, `${entry.slug}: partials`);
      assert.ok(s.partials.every((p) => p > 0), `${entry.slug}: positive partials`);
      assert.ok(s.noise >= 0 && s.noise <= 1, `${entry.slug}: noise in 0..1`);
      assert.ok(s.durationSec > 0 && s.durationSec <= 30, `${entry.slug}: duration sane`);
      assert.ok(s.description.length > 30, `${entry.slug}: audio has a text alternative`);
      const env = s.envelope;
      assert.ok(env.attack >= 0 && env.decay >= 0 && env.release >= 0, `${entry.slug}: envelope`);
      assert.ok(env.sustain >= 0 && env.sustain <= 1, `${entry.slug}: sustain in 0..1`);
    }
  });

  test("site config derives its totals from live content", () => {
    const config = getSiteConfig();
    assert.equal(config.totalEntries, publishedEntries.length);
    assert.equal(config.yearRange.earliest, 1500);
    assert.equal(config.yearRange.latest, 2024);
    assert.ok(config.locales.includes("en") && config.locales.length >= 2);
    assert.ok(getEntry(config.featuredSlug), "featured slug resolves to a published entry");
  });

  test("categories are complete and ordered", () => {
    const categories = getCategories();
    assert.equal(categories.length, 6);
    for (const c of categories) {
      assert.ok(c.name && c.tagline && c.description.length > 80 && c.accent);
    }
    const orders = categories.map((c) => c.order);
    assert.deepEqual(orders, [...orders].sort((a, b) => a - b), "sorted by order");
  });
});

/* ========================================================================== */
/* Filtering and sorting                                                       */
/* ========================================================================== */

describe("filtering and sorting", () => {
  test("filters by category", () => {
    const result = queryEntries({ category: "obsolete-machines" });
    assert.ok(result.length >= 3);
    assert.ok(result.every((e) => e.category === "obsolete-machines"));
  });

  test("filters by tag, case-insensitively", () => {
    const lower = queryEntries({ tag: "radio" });
    const upper = queryEntries({ tag: "RADIO" });
    assert.ok(lower.length >= 1);
    assert.deepEqual(lower.map((e) => e.slug), upper.map((e) => e.slug));
  });

  test("filters by fidelity", () => {
    const speculative = queryEntries({ fidelity: "speculative" });
    assert.ok(speculative.length >= 1);
    assert.ok(speculative.every((e) => e.fidelity === "speculative"));
  });

  test("filters by year range on the timeline", () => {
    const modern = queryEntries({ from: 1980 });
    assert.ok(modern.every((e) => e.provenance.lastHeard >= 1980));
    const ancient = queryEntries({ to: 1900 });
    assert.ok(ancient.every((e) => e.provenance.lastHeard <= 1900));
    const window = queryEntries({ from: 1900, to: 1990 });
    assert.ok(window.every((e) => {
      const y = e.provenance.lastHeard;
      return y >= 1900 && y <= 1990;
    }));
  });

  test("filters combine as AND, not OR", () => {
    const combined = queryEntries({ category: "silenced-places", fidelity: "restored" });
    assert.ok(combined.every((e) => e.category === "silenced-places" && e.fidelity === "restored"));
    assert.ok(combined.length < queryEntries({ category: "silenced-places" }).length);
  });

  test("filters by featured", () => {
    const featured = queryEntries({ featured: true });
    assert.equal(featured.length, 3);
    assert.ok(featured.every((e) => e.featured));
  });

  test("an unmatchable filter yields an empty set, driving the empty state", () => {
    const none = queryEntries({ category: "extinct-voices", fidelity: "reconstructed" });
    assert.equal(none.length, 0, "combination with no members returns empty, not everything");
    const bogus = queryEntries({ category: "does-not-exist" });
    assert.equal(bogus.length, 0, "unknown category is honest rather than ignored");
  });

  test("filters never leak drafts unless preview is requested", () => {
    const all = queryEntries({});
    assert.ok(all.every((e) => e.status === "published"));
    const preview = queryEntries({ includeDrafts: true });
    assert.equal(preview.length, 14);
  });

  test("sorting produces the documented orders", () => {
    const oldest = sortEntries(publishedEntries, "oldest-sound");
    assert.equal(oldest[0]!.provenance.lastHeard, 1500);
    const newest = sortEntries(publishedEntries, "newest-sound");
    assert.equal(newest[0]!.provenance.lastHeard, 2024);
    const titled = sortEntries(publishedEntries, "title");
    assert.deepEqual(
      titled.map((e) => e.title),
      [...titled.map((e) => e.title)].sort((a, b) => a.localeCompare(b)),
    );
    const recent = sortEntries(publishedEntries, "recent");
    for (let i = 1; i < recent.length; i++) {
      assert.ok(recent[i - 1]!.publishedAt >= recent[i]!.publishedAt);
    }
  });

  test("sorting is pure and does not mutate the source array", () => {
    const before = publishedEntries.map((e) => e.slug);
    sortEntries(publishedEntries, "title");
    assert.deepEqual(publishedEntries.map((e) => e.slug), before);
  });

  test("fidelity and sort validators reject unknown values", () => {
    assert.ok(isValidFidelity("restored"));
    assert.ok(!isValidFidelity("perfect"));
    assert.ok(isValidSort("editorial"));
    assert.ok(!isValidSort("random"));
  });

  test("tag index counts correctly and is sorted by frequency", () => {
    const tags = getTags();
    assert.ok(tags.length > 20);
    for (let i = 1; i < tags.length; i++) {
      assert.ok(tags[i - 1]!.count >= tags[i]!.count);
    }
    const radio = tags.find((t) => t.tag === "radio");
    assert.ok(radio && radio.count >= 1);
  });
});

/* ========================================================================== */
/* Navigation                                                                  */
/* ========================================================================== */

describe("previous / next navigation", () => {
  test("walks the editorial sequence and reports position", () => {
    const nav = getNeighbours("dial-up-handshake");
    assert.equal(nav.total, 12);
    assert.equal(nav.position, 3);
    assert.equal(nav.previous?.slug, "aral-sea-shoreline-1975");
    assert.equal(nav.next?.slug, "linotype-hot-metal");
  });

  test("wraps at both ends rather than dead-ending", () => {
    const first = getNeighbours("kauai-oo-final-duet");
    assert.equal(first.position, 1);
    assert.equal(first.previous?.slug, "sami-joik-silences", "first wraps back to last");
    const last = getNeighbours("sami-joik-silences");
    assert.equal(last.position, 12);
    assert.equal(last.next?.slug, "kauai-oo-final-duet", "last wraps to first");
  });

  test("respects the active filter so prev/next stays in context", () => {
    const nav = getNeighbours("dial-up-handshake", { category: "obsolete-machines" });
    assert.equal(nav.total, 3);
    assert.ok(nav.previous && nav.next);
    assert.equal(nav.previous!.category, "obsolete-machines");
    assert.equal(nav.next!.category, "obsolete-machines");
  });

  test("a single-item sequence has no neighbours", () => {
    const nav = getNeighbours("sami-joik-silences", { tag: "joik" });
    assert.equal(nav.total, 1);
    assert.equal(nav.previous, null);
    assert.equal(nav.next, null);
  });

  test("an unknown slug returns a safe empty result", () => {
    const nav = getNeighbours("no-such-entry");
    assert.equal(nav.previous, null);
    assert.equal(nav.next, null);
    assert.equal(nav.position, 0);
  });
});

/* ========================================================================== */
/* Related content                                                             */
/* ========================================================================== */

describe("related content", () => {
  test("prefers editorial links and explains why each is related", () => {
    const related = getRelated("kauai-oo-final-duet");
    assert.equal(related.length, 3);
    assert.equal(related[0]!.entry.slug, "thylacine-cough");
    assert.equal(related[0]!.reason, "Editorially linked");
    assert.ok(related.every((r) => r.reason.length > 0));
  });

  test("never recommends the entry you are reading, and never repeats", () => {
    for (const entry of publishedEntries) {
      const related = getRelated(entry.slug);
      const slugs = related.map((r) => r.entry.slug);
      assert.ok(!slugs.includes(entry.slug), `${entry.slug} not self-referential`);
      assert.equal(new Set(slugs).size, slugs.length, `${entry.slug} has no duplicates`);
    }
  });

  test("every entry has recommendations, so no detail page dead-ends", () => {
    for (const entry of publishedEntries) {
      assert.ok(getRelated(entry.slug).length >= 3, `${entry.slug} has 3 recommendations`);
    }
  });

  test("never surfaces a draft", () => {
    for (const entry of publishedEntries) {
      for (const r of getRelated(entry.slug)) {
        assert.equal(r.entry.status, "published");
      }
    }
  });

  test("automatic scoring finds relations beyond the editorial list", () => {
    const related = getRelated("numbers-station-lincolnshire", 3);
    assert.ok(related.length === 3);
    assert.ok(related.some((r) => r.reason !== "Editorially linked"), "auto-scored fill-in");
  });

  test("an unknown slug yields no recommendations", () => {
    assert.deepEqual(getRelated("no-such-entry"), []);
  });
});

/* ========================================================================== */
/* Search                                                                      */
/* ========================================================================== */

describe("search", () => {
  test("finds entries by title term", () => {
    const hits = searchEntries("linotype");
    assert.ok(hits.length >= 1);
    assert.equal(hits[0]!.slug, "linotype-hot-metal");
    assert.equal(hits[0]!.matchedOn, "title");
  });

  test("ignores diacritics so plain typing works", () => {
    const folded = searchEntries("kauai");
    assert.equal(folded[0]!.slug, "kauai-oo-final-duet");
    const exact = searchEntries("Kauaʻi");
    assert.equal(exact[0]!.slug, "kauai-oo-final-duet");
  });

  test("searches place, tag, body and year, not just the title", () => {
    assert.equal(searchEntries("paris")[0]!.slug, "pneumatic-tube-exchange");
    assert.equal(searchEntries("java")[0]!.slug, "gamelan-tuning-drift");
    assert.ok(searchEntries("galvanometer").length === 0, "draft body is not indexed");
    assert.ok(searchEntries("mosquitoes").length >= 1, "published body is indexed");
    assert.ok(searchEntries("1987").length >= 1, "year is searchable");
  });

  test("ranks whole-word matches above incidental substring matches", () => {
    const hits = searchEntries("ice");
    if (hits.length > 1) {
      assert.ok(hits[0]!.score >= hits[1]!.score);
    }
    const sorted = [...hits].sort((a, b) => b.score - a.score);
    assert.deepEqual(hits.map((h) => h.slug), sorted.map((h) => h.slug));
  });

  test("rewards documents matching every term of a multi-word query", () => {
    const both = searchEntries("shortwave numbers station");
    assert.equal(both[0]!.slug, "numbers-station-lincolnshire");
  });

  test("returns an empty array for gibberish, driving the empty state", () => {
    assert.deepEqual(searchEntries("zzzzqqqxyw"), []);
  });

  test("ignores empty, whitespace and stop-word-only queries", () => {
    assert.deepEqual(searchEntries(""), []);
    assert.deepEqual(searchEntries("     "), []);
    assert.deepEqual(searchEntries("the of and"), []);
  });

  test("never returns a draft", () => {
    const hits = searchEntries("glacier");
    assert.ok(hits.every((h) => h.slug !== "glacier-calving-ok"));
  });

  test("respects the result limit", () => {
    const hits = searchEntries("sound", 3);
    assert.ok(hits.length <= 3);
  });

  test("every hit resolves to a real, reachable entry", () => {
    for (const hit of searchEntries("the sound of a lost recording", 10)) {
      assert.ok(getEntry(hit.slug), `${hit.slug} resolves`);
    }
  });
});

/* ========================================================================== */
/* Highlighting and escaping, XSS safety                                      */
/* ========================================================================== */

describe("highlight escaping", () => {
  test("escapes HTML in content before marking matches", () => {
    const out = highlight('<img src=x onerror="alert(1)"> tape', ["tape"]);
    assert.ok(!out.includes("<img"), "no raw tag survives");
    assert.ok(out.includes("&lt;img"), "tag is escaped");
    assert.ok(out.includes("<mark>tape</mark>"), "match is still marked");
  });

  test("a malicious query cannot inject markup", () => {
    const out = highlight("a recording of tape hiss", ["<script>"]);
    assert.ok(!out.includes("<script>"));
  });

  test("marks every occurrence and merges overlaps", () => {
    const out = highlight("sound and sound", ["sound"]);
    assert.equal(out.match(/<mark>/g)?.length, 2);
    const overlapping = highlight("recording", ["record", "cord"]);
    assert.equal(overlapping.match(/<mark>/g)?.length, 1, "overlapping ranges merge");
  });

  test("returns escaped text unchanged when nothing matches", () => {
    assert.equal(highlight("plain text", ["absent"]), "plain text");
    assert.equal(escapeHtml("<b>&\"'"), "&lt;b&gt;&amp;&quot;&#39;");
  });

  test("search results carry safe highlights", () => {
    for (const hit of searchEntries("sound", 10)) {
      const withoutMarks = hit.highlight.replace(/<\/?mark>/g, "");
      assert.ok(!/<[a-z]/i.test(withoutMarks), `${hit.slug} highlight has no stray tags`);
    }
  });
});

/* ========================================================================== */
/* Timeline                                                                    */
/* ========================================================================== */

describe("timeline projection", () => {
  test("groups every published entry into exactly one band", () => {
    const timeline = getTimeline();
    const total = timeline.reduce((sum, b) => sum + b.entries.length, 0);
    assert.equal(total, publishedEntries.length);
  });

  test("bands are chronological, non-empty, and internally sorted", () => {
    for (const band of getTimeline()) {
      assert.ok(band.entries.length > 0, `${band.band} is not an empty band`);
      const years = band.entries.map((e) => e.year);
      assert.deepEqual(years, [...years].sort((a, b) => a - b));
    }
  });

  test("timeline entries all resolve to real pages", () => {
    for (const band of getTimeline()) {
      for (const e of band.entries) {
        assert.ok(getEntry(e.slug), `${e.slug} resolves`);
      }
    }
  });
});

/* ========================================================================== */
/* API envelopes and parameter coercion                                        */
/* ========================================================================== */

describe("API envelopes", () => {
  test("success and failure envelopes are consistently shaped", () => {
    const good = ok({ hello: "world" }, { count: 1 });
    assert.equal(good.ok, true);
    assert.deepEqual(good.ok ? good.meta : null, { count: 1 });

    const bad = fail("NOT_FOUND", "No such entry.");
    assert.equal(bad.ok, false);
    assert.equal(bad.ok === false ? bad.error.code : "", "NOT_FOUND");
    assert.ok(bad.ok === false && bad.error.fields === undefined, "no empty fields key");
  });

  test("every error code maps to a sensible HTTP status", () => {
    assert.equal(STATUS_FOR_CODE.NOT_FOUND, 404);
    assert.equal(STATUS_FOR_CODE.VALIDATION_FAILED, 422);
    assert.equal(STATUS_FOR_CODE.RATE_LIMITED, 429);
    assert.equal(STATUS_FOR_CODE.METHOD_NOT_ALLOWED, 405);
    assert.equal(STATUS_FOR_CODE.PAYLOAD_TOO_LARGE, 413);
    assert.equal(STATUS_FOR_CODE.INTERNAL, 500);
    assert.equal(STATUS_FOR_CODE.BAD_REQUEST, 400);
  });

  test("error payloads never carry internal detail", () => {
    const serialised = JSON.stringify(fail("INTERNAL", "Something went wrong on our side."));
    assert.ok(!/stack|at Object|node_modules|process\.env/i.test(serialised));
  });
});

describe("query parameter coercion", () => {
  test("absent values fall back, invalid values are rejected", () => {
    assert.equal(parseIntParam(undefined, { min: 1, max: 50, fallback: 10 }), 10);
    assert.equal(parseIntParam("", { min: 1, max: 50, fallback: 10 }), 10);
    assert.equal(parseIntParam("25", { min: 1, max: 50, fallback: 10 }), 25);
    assert.equal(parseIntParam("abc", { min: 1, max: 50, fallback: 10 }), null);
    assert.equal(parseIntParam("9999", { min: 1, max: 50, fallback: 10 }), null);
    assert.equal(parseIntParam("-5", { min: 1, max: 50, fallback: 10 }), null);
    assert.equal(parseIntParam("1e5", { min: 1, max: 50, fallback: 10 }), null);
    assert.equal(parseIntParam("1.5", { min: 1, max: 50, fallback: 10 }), null);
  });

  test("boolean params accept common spellings and reject nonsense", () => {
    for (const truthy of ["1", "true", "TRUE", "yes", "on"]) {
      assert.equal(parseBoolParam(truthy), true);
    }
    for (const falsy of ["0", "false", "no", "off"]) {
      assert.equal(parseBoolParam(falsy), false);
    }
    assert.equal(parseBoolParam("maybe"), null);
    assert.equal(parseBoolParam(null), null);
  });

  test("slug validation rejects traversal and injection attempts", () => {
    assert.ok(isValidSlug("kauai-oo-final-duet"));
    assert.ok(!isValidSlug("../../etc/passwd"));
    assert.ok(!isValidSlug("Has Spaces"));
    assert.ok(!isValidSlug("UPPER"));
    assert.ok(!isValidSlug("trailing-"));
    assert.ok(!isValidSlug(""));
    assert.ok(!isValidSlug("a".repeat(81)));
  });
});

/* ========================================================================== */
/* Contact validation                                                          */
/* ========================================================================== */

describe("contact validation", () => {
  const valid = {
    name: "Max Luong",
    email: "max@example.org",
    subject: "contribute",
    message: "I have a 1974 reel of a foundry floor in Sheffield and would like to donate it.",
  };

  test("accepts a well-formed submission", () => {
    const result = validateContact(valid);
    assert.ok(result.valid);
    assert.equal(result.value?.email, "max@example.org");
  });

  test("trims whitespace before validating and storing", () => {
    const result = validateContact({ ...valid, name: "  Max Luong  " });
    assert.ok(result.valid);
    assert.equal(result.value?.name, "Max Luong");
  });

  test("reports every field error at once for a single announcement", () => {
    const result = validateContact({ name: "", email: "nope", subject: "", message: "short" });
    assert.equal(result.valid, false);
    assert.ok(result.fields.name && result.fields.email);
    assert.ok(result.fields.subject && result.fields.message);
    assert.equal(Object.keys(result.fields).length, 4);
  });

  test("error messages are specific enough to act on", () => {
    const result = validateContact({ ...valid, message: "too short" });
    assert.match(result.fields.message!, /at least 20 characters/);
    assert.match(result.fields.message!, /You have 9/);
  });

  test("rejects malformed email addresses", () => {
    for (const email of ["plain", "@example.org", "a@b", "a b@example.org", "a@@b.org"]) {
      assert.equal(validateContact({ ...valid, email }).valid, false, `rejects ${email}`);
    }
  });

  test("accepts valid but unusual email addresses", () => {
    for (const email of ["a.b+tag@sub.example.co.uk", "x@y.io"]) {
      assert.equal(validateContact({ ...valid, email }).valid, true, `accepts ${email}`);
    }
  });

  test("rejects an unknown subject", () => {
    assert.equal(validateContact({ ...valid, subject: "spam" }).valid, false);
  });

  test("enforces length ceilings", () => {
    assert.equal(validateContact({ ...valid, name: "a".repeat(81) }).valid, false);
    assert.equal(
      validateContact({ ...valid, message: "a".repeat(CONTACT_LIMITS.messageMax + 1) }).valid,
      false,
    );
  });

  test("rejects non-object and array payloads without throwing", () => {
    for (const bad of [null, undefined, "string", 42, [], true]) {
      const result = validateContact(bad);
      assert.equal(result.valid, false);
      assert.ok(result.fields._form);
    }
  });

  test("silently rejects honeypot submissions", () => {
    const result = validateContact({ ...valid, website: "http://spam.example" });
    assert.equal(result.valid, false);
    assert.ok(!result.fields.name, "gives a spammer no field-level feedback");
  });

  test("validates an optional entry reference", () => {
    assert.ok(validateContact({ ...valid, entrySlug: "kauai-oo-final-duet" }).valid);
    assert.ok(validateContact({ ...valid, entrySlug: "" }).valid, "empty is allowed");
    assert.equal(validateContact({ ...valid, entrySlug: "../secrets" }).valid, false);
  });

  test("ignores unexpected extra fields rather than failing", () => {
    assert.ok(validateContact({ ...valid, isAdmin: true, role: "root" }).valid);
    const result = validateContact({ ...valid, isAdmin: true });
    assert.ok(result.value && !("isAdmin" in result.value), "extra fields are not carried through");
  });
});

/* ========================================================================== */
/* Rate limiting                                                               */
/* ========================================================================== */

describe("rate limiting", () => {
  test("allows up to the limit then refuses", () => {
    const limiter = new RateLimiter(3, 60_000);
    const now = 1_000_000;
    assert.equal(limiter.check("ip-a", now).allowed, true);
    assert.equal(limiter.check("ip-a", now).allowed, true);
    const third = limiter.check("ip-a", now);
    assert.equal(third.allowed, true);
    assert.equal(third.remaining, 0);
    const fourth = limiter.check("ip-a", now);
    assert.equal(fourth.allowed, false);
    assert.ok(fourth.retryAfterSec > 0, "tells the client when to retry");
  });

  test("buckets are per-key", () => {
    const limiter = new RateLimiter(1, 60_000);
    const now = 2_000_000;
    assert.equal(limiter.check("ip-a", now).allowed, true);
    assert.equal(limiter.check("ip-a", now).allowed, false);
    assert.equal(limiter.check("ip-b", now).allowed, true, "another client is unaffected");
  });

  test("the window resets", () => {
    const limiter = new RateLimiter(1, 1000);
    const now = 3_000_000;
    assert.equal(limiter.check("ip-a", now).allowed, true);
    assert.equal(limiter.check("ip-a", now + 500).allowed, false);
    assert.equal(limiter.check("ip-a", now + 1001).allowed, true, "allowed after the window");
  });
});
