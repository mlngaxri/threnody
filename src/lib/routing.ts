import { categories } from "../content/categories.ts";
import { publishedEntries } from "./repository.ts";

/**
 * Both /entries/[slug] and /categories/[slug] read searchParams, because the
 * filter and sort state has to survive navigation. That makes them dynamically
 * rendered, and a dynamically rendered route calls notFound() after the
 * response has already committed, so the archive was answering unknown slugs
 * with the correct "not in the archive" page under a misleading HTTP 200.
 *
 * Catching it at the edge instead is both correct and cheaper: the request
 * never reaches a renderer, so an unknown slug costs a string lookup rather
 * than a full server render, and crawlers get an honest 404.
 */

const ENTRY_SLUGS: ReadonlySet<string> = new Set(publishedEntries.map((e) => e.slug));
const CATEGORY_SLUGS: ReadonlySet<string> = new Set(categories.map((c) => c.slug));

/**
 * Decide whether a pathname addresses something the archive does not hold.
 *
 * Only the two slug-addressed collections are checked. Anything else, including
 * nested segments such as the per-entry Open Graph image, is resolved against
 * the same slug so a missing entry cannot leak an image either.
 */
export function isUnknownArchivePath(pathname: string): boolean {
  const match = /^\/(entries|categories)\/([^/]+)(?:\/[^/]+)?\/?$/.exec(pathname);
  if (!match) return false;

  const [, collection = "", rawSlug = ""] = match;

  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // A malformed percent-escape cannot name anything real.
    return true;
  }

  return collection === "entries" ? !ENTRY_SLUGS.has(slug) : !CATEGORY_SLUGS.has(slug);
}

/**
 * A path that deliberately matches no route. Rewriting to it makes Next render
 * the archive's own not-found page and, crucially, send a real 404 status.
 */
export const NOT_IN_ARCHIVE_PATH = "/not-in-the-archive";
