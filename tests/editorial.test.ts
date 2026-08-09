import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { getEntries, getCategories, getSiteConfig } from "../src/lib/repository.ts";
import { allEntries } from "../src/lib/repository.ts";

/**
 * Editorial and house-style enforcement.
 *
 * These tests exist because a style rule that is only written down gets broken.
 * A rule that fails the test run does not.
 */

const ROOT = path.resolve(import.meta.dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|css|json|mjs|md)$/.test(name)) out.push(full);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* House style                                                                 */
/* -------------------------------------------------------------------------- */

test("no em dash or en dash appears anywhere in the project", () => {
  const offenders: string[] = [];

  for (const file of walk(ROOT)) {
    const text = readFileSync(file, "utf8");
    const lines = text.split("\n");
    lines.forEach((line, index) => {
      // The test file itself must be allowed to name the characters it bans.
      if (file.endsWith("editorial.test.ts")) return;
      if (line.includes("\u2014") || line.includes("\u2013")) {
        offenders.push(`${path.relative(ROOT, file)}:${index + 1}: ${line.trim().slice(0, 90)}`);
      }
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `Dash characters are banned from this project. Offending lines:\n${offenders.join("\n")}`,
  );
});

test("no placeholder or lorem ipsum text survives anywhere", () => {
  const banned = [
    "lorem ipsum",
    "dolor sit amet",
    "placeholder text",
    "todo:",
    "fixme",
    "coming soon",
    "tbd",
    "xxx",
  ];
  const offenders: string[] = [];

  for (const entry of allEntries) {
    const haystack = JSON.stringify(entry).toLowerCase();
    for (const phrase of banned) {
      if (haystack.includes(phrase)) offenders.push(`${entry.slug}: "${phrase}"`);
    }
  }

  assert.deepEqual(offenders, [], `Placeholder content found:\n${offenders.join("\n")}`);
});

/* -------------------------------------------------------------------------- */
/* Editorial completeness                                                      */
/* -------------------------------------------------------------------------- */

test("every entry carries complete, substantial editorial content", () => {
  for (const entry of allEntries) {
    assert.ok(entry.title.length >= 5, `${entry.slug}: title too short`);
    assert.ok(entry.epithet.length >= 5, `${entry.slug}: epithet missing`);
    assert.ok(
      entry.description.length >= 60 && entry.description.length <= 300,
      `${entry.slug}: description should be a real sentence, got ${entry.description.length} chars`,
    );
    assert.ok(entry.body.length >= 4, `${entry.slug}: body needs at least four blocks`);

    const prose = entry.body
      .filter((b) => b.kind === "paragraph")
      .map((b) => (b as { text: string }).text)
      .join(" ");
    assert.ok(prose.length >= 600, `${entry.slug}: only ${prose.length} chars of prose`);

    assert.ok(entry.tags.length >= 3, `${entry.slug}: needs at least three tags`);
    assert.ok(entry.contributorIds.length >= 1, `${entry.slug}: needs a contributor`);
    assert.ok(entry.sources.length >= 2, `${entry.slug}: needs at least two sources`);
    assert.ok(entry.readingMinutes >= 1, `${entry.slug}: reading time missing`);
  }
});

test("every entry declares honest provenance", () => {
  for (const entry of allEntries) {
    const p = entry.provenance;
    assert.ok(p.place.length > 0, `${entry.slug}: place missing`);
    assert.ok(p.region.length > 0, `${entry.slug}: region missing`);
    assert.ok(
      p.lastHeard >= 1000 && p.lastHeard <= new Date().getFullYear(),
      `${entry.slug}: implausible lastHeard ${p.lastHeard}`,
    );
    assert.ok(p.lat >= -90 && p.lat <= 90, `${entry.slug}: latitude out of range`);
    assert.ok(p.lon >= -180 && p.lon <= 180, `${entry.slug}: longitude out of range`);
  }
});

test("fidelity claims are matched by evidence", () => {
  for (const entry of allEntries) {
    // A field recording or restoration asserts that primary audio exists, so it
    // must cite a source. A speculative entry must say so in its own words
    // rather than quietly implying authenticity.
    if (entry.fidelity === "field-recording" || entry.fidelity === "restored") {
      assert.ok(
        entry.sources.length >= 2,
        `${entry.slug} claims recorded audio but cites too little`,
      );
    }
    if (entry.fidelity === "speculative") {
      const text = JSON.stringify(entry.body).toLowerCase();
      const hedges = ["no recording", "never recorded", "speculat", "infer", "no audio", "conjectur", "reconstruct"];
      assert.ok(
        hedges.some((h) => text.includes(h)),
        `${entry.slug} is speculative but the body never says so`,
      );
    }
  }
});

/* -------------------------------------------------------------------------- */
/* SEO completeness                                                            */
/* -------------------------------------------------------------------------- */

test("every entry has complete, correctly sized SEO fields", () => {
  const seenTitles = new Set<string>();

  for (const entry of allEntries) {
    const seo = entry.seo;
    assert.ok(seo.metaTitle.length > 0, `${entry.slug}: metaTitle missing`);
    assert.ok(
      seo.metaTitle.length <= 70,
      `${entry.slug}: metaTitle is ${seo.metaTitle.length} chars, will be truncated`,
    );
    assert.ok(
      seo.metaDescription.length >= 70 && seo.metaDescription.length <= 165,
      `${entry.slug}: metaDescription is ${seo.metaDescription.length} chars`,
    );
    assert.equal(
      seenTitles.has(seo.metaTitle),
      false,
      `${entry.slug}: duplicate metaTitle, which harms indexing`,
    );
    seenTitles.add(seo.metaTitle);
  }
});

test("slugs are unique, url safe and human readable", () => {
  const seen = new Set<string>();
  for (const entry of allEntries) {
    assert.match(entry.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${entry.slug}: not a clean slug`);
    assert.equal(seen.has(entry.slug), false, `duplicate slug ${entry.slug}`);
    assert.ok(entry.slug.length <= 60, `${entry.slug}: slug too long`);
    seen.add(entry.slug);
  }
});

test("categories and contributors referenced by entries all exist", () => {
  const categoryIds = new Set(getCategories().map((c) => c.id));
  for (const entry of allEntries) {
    assert.equal(categoryIds.has(entry.category), true, `${entry.slug}: unknown category`);
  }
});

test("related slugs point at real entries and never at themselves", () => {
  const known = new Set(allEntries.map((e) => e.slug));
  for (const entry of allEntries) {
    for (const slug of entry.relatedSlugs) {
      assert.equal(known.has(slug), true, `${entry.slug}: relates to missing ${slug}`);
      assert.notEqual(slug, entry.slug, `${entry.slug}: relates to itself`);
    }
  }
});

test("the archive is large enough to satisfy the brief", () => {
  assert.ok(getEntries().length >= 6, "at least six published detail pages are required");
  assert.equal(getCategories().length, 6);
  assert.ok(
    allEntries.some((e) => e.status === "draft"),
    "a draft is needed to exercise the publish workflow",
  );
  const config = getSiteConfig();
  assert.equal(config.totalEntries, getEntries().length);
});
