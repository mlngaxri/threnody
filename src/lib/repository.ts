import type {
  Category,
  CategoryId,
  Contributor,
  Entry,
  Fidelity,
  SearchHit,
  SiteConfig,
} from "./types.ts";
import { entries as rawEntries } from "../content/entries.ts";
import { categories, contributors, siteConfig } from "../content/categories.ts";

/**
 * The repository: the single read path to archive content.
 *
 * Framework-free on purpose. Next.js route handlers and server components call
 * into this module; this module knows nothing about them, which is what allows
 * the whole data layer to be executed and tested under plain Node.
 */

/* -------------------------------------------------------------------------- */
/* Derived indices, computed once per process                                  */
/* -------------------------------------------------------------------------- */

const bySlug = new Map<string, Entry>();
const byCategory = new Map<CategoryId, Entry[]>();
const tagCounts = new Map<string, number>();

for (const entry of rawEntries) {
  bySlug.set(entry.slug, entry);
}

/** Published entries only, in stable editorial order. */
export const publishedEntries: Entry[] = rawEntries
  .filter((e) => e.status === "published")
  .sort((a, b) => a.order - b.order);

/** All entries including drafts. Only ever exposed through preview mode. */
export const allEntries: Entry[] = [...rawEntries].sort((a, b) => a.order - b.order);

for (const entry of publishedEntries) {
  const list = byCategory.get(entry.category) ?? [];
  list.push(entry);
  byCategory.set(entry.category, list);
  for (const tag of entry.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
}

/* -------------------------------------------------------------------------- */
/* Basic accessors                                                             */
/* -------------------------------------------------------------------------- */

export function getEntries(opts: { includeDrafts?: boolean } = {}): Entry[] {
  return opts.includeDrafts ? allEntries : publishedEntries;
}

/**
 * Look up one entry by slug. Returns null rather than throwing so callers can
 * map cleanly onto a 404 response.
 */
export function getEntry(slug: string, opts: { includeDrafts?: boolean } = {}): Entry | null {
  const entry = bySlug.get(slug);
  if (!entry) return null;
  if (entry.status !== "published" && !opts.includeDrafts) return null;
  return entry;
}

export function getCategories(): Category[] {
  return [...categories].sort((a, b) => a.order - b.order);
}

export function getCategory(slug: string): Category | null {
  return categories.find((c) => c.slug === slug) ?? null;
}

export function getContributor(id: string): Contributor | null {
  return contributors.find((c) => c.id === id) ?? null;
}

export function getContributors(): Contributor[] {
  return contributors;
}

export function countEntriesInCategory(id: CategoryId): number {
  return byCategory.get(id)?.length ?? 0;
}

/** Tags with their frequency, most used first. Powers the tag cloud filter. */
export function getTags(): Array<{ tag: string; count: number }> {
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Site config with the volatile numbers computed from live content. */
export function getSiteConfig(): SiteConfig {
  const years = publishedEntries.map((e) => e.provenance.lastHeard);
  return {
    ...siteConfig,
    totalEntries: publishedEntries.length,
    yearRange: {
      earliest: years.length ? Math.min(...years) : 0,
      latest: years.length ? Math.max(...years) : 0,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Filtering and sorting                                                       */
/* -------------------------------------------------------------------------- */

export type SortKey = "editorial" | "recent" | "oldest-sound" | "newest-sound" | "title";

export interface FilterQuery {
  category?: string;
  tag?: string;
  fidelity?: string;
  /** Inclusive lower/upper bounds on provenance.lastHeard. */
  from?: number;
  to?: number;
  featured?: boolean;
  sort?: SortKey;
  includeDrafts?: boolean;
}

const VALID_FIDELITY: Fidelity[] = ["field-recording", "restored", "reconstructed", "speculative"];
const VALID_SORTS: SortKey[] = ["editorial", "recent", "oldest-sound", "newest-sound", "title"];

export function isValidFidelity(value: string): value is Fidelity {
  return (VALID_FIDELITY as string[]).includes(value);
}

export function isValidSort(value: string): value is SortKey {
  return (VALID_SORTS as string[]).includes(value);
}

/**
 * Apply filters then sort. Unknown filter values yield an empty result set
 * rather than being silently ignored, so the UI can show a truthful empty state
 * instead of pretending the filter did not exist.
 */
export function queryEntries(q: FilterQuery): Entry[] {
  let result = getEntries({ includeDrafts: q.includeDrafts });

  if (q.category) {
    result = result.filter((e) => e.category === q.category);
  }
  if (q.tag) {
    const tag = q.tag.toLowerCase();
    result = result.filter((e) => e.tags.some((t) => t.toLowerCase() === tag));
  }
  if (q.fidelity) {
    result = result.filter((e) => e.fidelity === q.fidelity);
  }
  if (typeof q.from === "number") {
    result = result.filter((e) => e.provenance.lastHeard >= q.from!);
  }
  if (typeof q.to === "number") {
    result = result.filter((e) => e.provenance.lastHeard <= q.to!);
  }
  if (q.featured === true) {
    result = result.filter((e) => e.featured);
  }

  return sortEntries(result, q.sort ?? "editorial");
}

export function sortEntries(list: Entry[], sort: SortKey): Entry[] {
  const copy = [...list];
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.order - b.order);
    case "oldest-sound":
      return copy.sort(
        (a, b) => a.provenance.lastHeard - b.provenance.lastHeard || a.order - b.order,
      );
    case "newest-sound":
      return copy.sort(
        (a, b) => b.provenance.lastHeard - a.provenance.lastHeard || a.order - b.order,
      );
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "editorial":
    default:
      return copy.sort((a, b) => a.order - b.order);
  }
}

/* -------------------------------------------------------------------------- */
/* Sequence navigation: previous / next                                        */
/* -------------------------------------------------------------------------- */

/**
 * Previous and next within a given ordering, so prev/next respects whatever
 * filter or sort the reader arrived with rather than jumping to an unrelated
 * entry. Wraps around, and returns nulls for a single-item sequence.
 */
export function getNeighbours(
  slug: string,
  q: FilterQuery = {},
): { previous: Entry | null; next: Entry | null; position: number; total: number } {
  const sequence = queryEntries(q);
  const index = sequence.findIndex((e) => e.slug === slug);
  if (index === -1 || sequence.length === 0) {
    return { previous: null, next: null, position: 0, total: sequence.length };
  }
  if (sequence.length === 1) {
    return { previous: null, next: null, position: 1, total: 1 };
  }
  const previous = sequence[(index - 1 + sequence.length) % sequence.length] ?? null;
  const next = sequence[(index + 1) % sequence.length] ?? null;
  return { previous, next, position: index + 1, total: sequence.length };
}

/* -------------------------------------------------------------------------- */
/* Related content                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Editorial relations first, then automatic ones scored by shared tags,
 * shared category, shared contributors and temporal proximity. This means a new
 * entry becomes discoverable from existing entries without anyone editing them.
 */
export function getRelated(slug: string, limit = 3): Array<{ entry: Entry; reason: string }> {
  const source = getEntry(slug);
  if (!source) return [];

  const picked: Array<{ entry: Entry; reason: string }> = [];
  const seen = new Set<string>([slug]);

  for (const relatedSlug of source.relatedSlugs) {
    const entry = getEntry(relatedSlug);
    if (entry && !seen.has(entry.slug)) {
      picked.push({ entry, reason: "Editorially linked" });
      seen.add(entry.slug);
    }
  }

  if (picked.length >= limit) return picked.slice(0, limit);

  const scored = publishedEntries
    .filter((e) => !seen.has(e.slug))
    .map((candidate) => {
      let score = 0;
      const reasons: string[] = [];

      const sharedTags = candidate.tags.filter((t) => source.tags.includes(t));
      if (sharedTags.length) {
        score += sharedTags.length * 3;
        reasons.push(`shares ${sharedTags.slice(0, 2).join(" and ")}`);
      }
      if (candidate.category === source.category) {
        score += 2;
        reasons.push("same section");
      }
      const sharedPeople = candidate.contributorIds.filter((c) =>
        source.contributorIds.includes(c),
      );
      if (sharedPeople.length) {
        score += 2;
        reasons.push("shared contributor");
      }
      if (candidate.fidelity === source.fidelity) score += 1;

      const gap = Math.abs(candidate.provenance.lastHeard - source.provenance.lastHeard);
      if (gap <= 15) {
        score += 2;
        reasons.push("close in time");
      } else if (gap <= 40) {
        score += 1;
      }

      return { entry: candidate, score, reason: reasons[0] ?? "Adjacent in the archive" };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.order - b.entry.order);

  for (const candidate of scored) {
    if (picked.length >= limit) break;
    picked.push({
      entry: candidate.entry,
      reason: candidate.reason.charAt(0).toUpperCase() + candidate.reason.slice(1),
    });
    seen.add(candidate.entry.slug);
  }

  return picked.slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Search                                                                      */
/* -------------------------------------------------------------------------- */

const STOP_WORDS = new Set([
  "the", "a", "an", "of", "and", "or", "in", "on", "at", "to", "for", "is", "was", "it", "that",
  "this", "with", "by", "from", "as", "be", "are", "were",
]);

/** Escape HTML so highlighted output can be injected safely. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9\u00c0-\u024f\u1e00-\u1eff]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Normalise text for matching.
 *
 * Strips combining diacritics via NFD, and separately removes the modifier
 * letters and typographic apostrophes that NFD leaves intact, the ʻokina in
 * "Kauaʻi" is U+02BB, a letter in its own right, so without this a reader
 * typing "kauai" would get no results.
 */
function fold(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u02bb\u02bc\u02bd\u2018\u2019\u02b9\u0027`]/g, "")
    .toLowerCase();
}

interface IndexedDoc {
  entry: Entry;
  fields: Record<string, string>;
}

const searchIndex: IndexedDoc[] = publishedEntries.map((entry) => ({
  entry,
  fields: {
    title: fold(entry.title),
    epithet: fold(entry.epithet),
    description: fold(entry.description),
    tags: fold(entry.tags.join(" ")),
    category: fold(entry.category.replace(/-/g, " ")),
    place: fold(`${entry.provenance.place} ${entry.provenance.region}`),
    body: fold(
      entry.body
        .map((b) => ("text" in b ? b.text : "caption" in b ? b.caption : ""))
        .join(" "),
    ),
    year: String(entry.provenance.lastHeard),
  },
}));

const FIELD_WEIGHTS: Record<string, number> = {
  title: 10,
  epithet: 6,
  tags: 5,
  place: 4,
  description: 3,
  category: 3,
  year: 3,
  body: 1,
};

/**
 * Scored full-text search over the archive.
 * Deliberately simple and dependency-free: weighted field matching with a bonus
 * for prefix matches and for documents matching every query term.
 */
export function searchEntries(rawQuery: string, limit = 10): SearchHit[] {
  const terms = tokenize(fold(rawQuery));
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];

  for (const doc of searchIndex) {
    let score = 0;
    let bestField = "";
    let bestFieldScore = 0;
    let termsMatched = 0;

    for (const term of terms) {
      let termScore = 0;
      for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
        const haystack = doc.fields[field];
        if (!haystack) continue;
        const idx = haystack.indexOf(term);
        if (idx === -1) continue;

        // Whole-word matches outrank substring matches.
        const boundaryBefore = idx === 0 || !/[a-z0-9]/.test(haystack[idx - 1] ?? "");
        const after = haystack[idx + term.length] ?? "";
        const boundaryAfter = after === "" || !/[a-z0-9]/.test(after);
        const exact = boundaryBefore && boundaryAfter;
        const prefix = boundaryBefore;

        const fieldScore = weight * (exact ? 2 : prefix ? 1.4 : 1);
        termScore += fieldScore;
        if (fieldScore > bestFieldScore) {
          bestFieldScore = fieldScore;
          bestField = field;
        }
      }
      if (termScore > 0) termsMatched += 1;
      score += termScore;
    }

    if (score === 0) continue;
    // Reward documents that satisfy the whole query, not just one term.
    if (termsMatched === terms.length && terms.length > 1) score *= 1.6;
    if (doc.entry.featured) score += 1;

    hits.push({
      slug: doc.entry.slug,
      title: doc.entry.title,
      epithet: doc.entry.epithet,
      category: doc.entry.category,
      score: Math.round(score * 100) / 100,
      matchedOn: bestField,
      highlight: highlight(doc.entry.description, terms),
    });
  }

  return hits
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/**
 * Wrap query terms in <mark>. Escapes first, so the returned string is safe to
 * render as HTML and cannot carry injected markup from either content or query.
 */
export function highlight(text: string, terms: string[]): string {
  const escaped = escapeHtml(text);
  if (terms.length === 0) return escaped;

  const folded = fold(escaped);
  const ranges: Array<[number, number]> = [];

  for (const term of terms) {
    let from = 0;
    for (;;) {
      const idx = folded.indexOf(term, from);
      if (idx === -1) break;
      ranges.push([idx, idx + term.length]);
      from = idx + term.length;
    }
  }
  if (ranges.length === 0) return escaped;

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
    } else {
      merged.push([range[0], range[1]]);
    }
  }

  let out = "";
  let cursor = 0;
  for (const [start, end] of merged) {
    out += escaped.slice(cursor, start) + "<mark>" + escaped.slice(start, end) + "</mark>";
    cursor = end;
  }
  return out + escaped.slice(cursor);
}

/**
 * Query suggestions used by the command palette when a search returns nothing.
 *
 * Bare years make useless suggestions, so they are excluded in favour of tags
 * that read as subjects. Ordered by how many entries a suggestion would actually
 * return, so no suggestion ever leads to a second empty state.
 */
export function getSuggestions(limit = 6): string[] {
  const isYearLike = (tag: string) => /^\d{4}s?$/.test(tag.trim());

  const fromTags = getTags()
    .filter((t) => !isYearLike(t.tag) && t.count > 0)
    .map((t) => t.tag);

  const suggestions: string[] = [];
  const seen = new Set<string>();

  for (const tag of fromTags) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push(tag);
    if (suggestions.length >= limit) break;
  }

  // Categories backfill if the tag vocabulary is ever thinner than the limit.
  if (suggestions.length < limit) {
    for (const category of getCategories()) {
      const key = category.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push(category.name);
      if (suggestions.length >= limit) break;
    }
  }

  return suggestions;
}

/* -------------------------------------------------------------------------- */
/* Timeline projection                                                         */
/* -------------------------------------------------------------------------- */

/** Entries projected onto the extinction timeline, grouped into century bands. */
export function getTimeline(): Array<{
  band: string;
  from: number;
  to: number;
  entries: Array<{ slug: string; title: string; year: number; category: CategoryId }>;
}> {
  const bands = [
    { band: "Before 1800", from: -Infinity, to: 1799 },
    { band: "1800-1899", from: 1800, to: 1899 },
    { band: "1900-1949", from: 1900, to: 1949 },
    { band: "1950-1979", from: 1950, to: 1979 },
    { band: "1980-1999", from: 1980, to: 1999 },
    { band: "2000 onward", from: 2000, to: Infinity },
  ];

  return bands
    .map((b) => ({
      band: b.band,
      from: b.from === -Infinity ? 0 : b.from,
      to: b.to === Infinity ? new Date().getFullYear() : b.to,
      entries: publishedEntries
        .filter((e) => e.provenance.lastHeard >= b.from && e.provenance.lastHeard <= b.to)
        .map((e) => ({
          slug: e.slug,
          title: e.title,
          year: e.provenance.lastHeard,
          category: e.category,
        }))
        .sort((a, b2) => a.year - b2.year),
    }))
    .filter((b) => b.entries.length > 0);
}
