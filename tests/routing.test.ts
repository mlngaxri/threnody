import assert from "node:assert/strict";
import { test } from "node:test";
import { categories } from "../src/content/categories.ts";
import { entries } from "../src/content/entries.ts";
import { publishedEntries } from "../src/lib/repository.ts";
import { isUnknownArchivePath, NOT_IN_ARCHIVE_PATH } from "../src/lib/routing.ts";

test("every published entry slug is treated as known", () => {
  for (const entry of publishedEntries) {
    assert.equal(
      isUnknownArchivePath(`/entries/${entry.slug}`),
      false,
      `${entry.slug} should resolve`,
    );
  }
});

test("every category slug is treated as known", () => {
  for (const category of categories) {
    assert.equal(isUnknownArchivePath(`/categories/${category.slug}`), false);
  }
});

test("draft entries are unknown, so a draft cannot be reached by guessing", () => {
  const drafts = entries.filter((e) => e.status !== "published");
  assert.ok(drafts.length > 0, "fixture should contain at least one draft");

  for (const draft of drafts) {
    assert.equal(isUnknownArchivePath(`/entries/${draft.slug}`), true);
  }
});

test("unknown slugs are rejected", () => {
  assert.equal(isUnknownArchivePath("/entries/no-such-entry"), true);
  assert.equal(isUnknownArchivePath("/categories/no-such-category"), true);
});

test("nested segments resolve against the same slug", () => {
  const known = publishedEntries[0].slug;
  assert.equal(isUnknownArchivePath(`/entries/${known}/opengraph-image`), false);
  assert.equal(isUnknownArchivePath("/entries/no-such-entry/opengraph-image"), true);
});

test("a trailing slash does not change the verdict", () => {
  const known = publishedEntries[0].slug;
  assert.equal(isUnknownArchivePath(`/entries/${known}/`), false);
  assert.equal(isUnknownArchivePath("/entries/no-such-entry/"), true);
});

test("percent-encoded known slugs still resolve", () => {
  const known = publishedEntries[0].slug;
  assert.equal(isUnknownArchivePath(`/entries/${encodeURIComponent(known)}`), false);
});

test("a malformed percent-escape is unknown rather than a crash", () => {
  assert.doesNotThrow(() => isUnknownArchivePath("/entries/%E0%A4%A"));
  assert.equal(isUnknownArchivePath("/entries/%E0%A4%A"), true);
});

test("collection index pages are left alone", () => {
  assert.equal(isUnknownArchivePath("/entries"), false);
  assert.equal(isUnknownArchivePath("/categories"), false);
  assert.equal(isUnknownArchivePath("/categories/"), false);
});

test("paths outside the two slug collections are left alone", () => {
  for (const path of ["/", "/atlas", "/timeline", "/search", "/api/entries"]) {
    assert.equal(isUnknownArchivePath(path), false, path);
  }
});

test("the rewrite target matches no real route", () => {
  assert.ok(NOT_IN_ARCHIVE_PATH.startsWith("/"));
  assert.equal(isUnknownArchivePath(NOT_IN_ARCHIVE_PATH), false);
});
