/**
 * THRENODY, core domain types.
 *
 * These types are intentionally free of any framework import so that the whole
 * data + API core can be executed and unit-tested under plain Node, and merely
 * *wrapped* by Next.js route handlers. Nothing in this file may import from
 * "next", "react", or any third-party package.
 */

/** Publication lifecycle of an archive entry. */
export type EntryStatus = "draft" | "published";

/** Top-level taxonomy. Every entry belongs to exactly one category. */
export type CategoryId =
  | "extinct-voices"
  | "silenced-places"
  | "obsolete-machines"
  | "vanished-rituals"
  | "lost-instruments"
  | "atmospheric-ghosts";

/** How confident the archive is in its acoustic reconstruction. */
export type Fidelity =
  | "field-recording" // an authentic recording survives
  | "restored" // a damaged recording, repaired
  | "reconstructed" // rebuilt from notation, description, or physical modelling
  | "speculative"; // an informed synthesis; no primary audio exists

/** A contributor credited on an entry. */
export interface Contributor {
  id: string;
  name: string;
  role: string;
  affiliation: string;
  bio: string;
}

/** A synthesis recipe the client turns into audible sound with WebAudio. */
export interface SoundSignature {
  /** Base frequency in Hz that anchors the reconstruction. */
  baseHz: number;
  /** Partial multipliers relative to baseHz, describing timbre. */
  partials: number[];
  /** Amplitude envelope in seconds. */
  envelope: { attack: number; decay: number; sustain: number; release: number };
  /** Broadband noise blended into the tone, 0..1. */
  noise: number;
  /** Overall duration of one utterance, in seconds. */
  durationSec: number;
  /** Human-readable description for screen readers and no-audio contexts. */
  description: string;
}

/** A point on the extinction timeline and the world map. */
export interface Provenance {
  place: string;
  region: string;
  /** WGS84 latitude/longitude, used by the atlas view. */
  lat: number;
  lon: number;
  /** Year the sound was last reliably heard. */
  lastHeard: number;
  /** Year the sound is first attested, where known. */
  firstAttested: number | null;
}

/** Structured citation supporting an entry's claims. */
export interface Source {
  label: string;
  detail: string;
  year: number;
}

/** Per-page search-engine and social-sharing fields. */
export interface SeoFields {
  metaTitle: string;
  metaDescription: string;
  ogImageAlt: string;
  keywords: string[];
}

/** A single archive entry: the atomic unit of THRENODY's content model. */
export interface Entry {
  id: string;
  slug: string;
  title: string;
  /** Short subtitle shown under the title. */
  epithet: string;
  /** One-sentence summary used in cards, search results, and meta description. */
  description: string;
  /** Long-form body, authored as an ordered list of blocks. */
  body: EntryBlock[];
  category: CategoryId;
  tags: string[];
  fidelity: Fidelity;
  status: EntryStatus;
  featured: boolean;
  /** Manual sort weight; lower sorts first within equal relevance. */
  order: number;
  publishedAt: string; // ISO-8601 date
  updatedAt: string; // ISO-8601 date
  contributorIds: string[];
  provenance: Provenance;
  sound: SoundSignature;
  sources: Source[];
  /** Explicit editorial relations; the resolver augments these automatically. */
  relatedSlugs: string[];
  seo: SeoFields;
  /** Estimated reading time in minutes, derived at build time. */
  readingMinutes: number;
}

/** Long-form body blocks. Kept deliberately small and renderable. */
export type EntryBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "quote"; text: string; attribution: string }
  | { kind: "listen"; caption: string }
  | { kind: "figure"; caption: string; alt: string }
  /**
   * An editorial caveat. Used to state plainly what is evidence and what is
   * inference. Rendered with distinct styling and an explicit label so a reader
   * can never mistake a caveat for narration.
   */
  | { kind: "note"; text: string };

/** A category record, stored as data rather than hardcoded in components. */
export interface Category {
  id: CategoryId;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  /** Accent colour token, resolved against the design system. */
  accent: string;
  order: number;
}

/** Site-wide configuration served by /api/site-config. */
export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  locales: string[];
  defaultLocale: string;
  socialHandle: string;
  featuredSlug: string;
  totalEntries: number;
  yearRange: { earliest: number; latest: number };
}

/** Uniform envelope returned by every API route. */
export type ApiResponse<T> =
  | { ok: true; data: T; meta?: Record<string, unknown> }
  | { ok: false; error: ApiError };

/** Machine-readable error payload. Never contains secrets or stack traces. */
export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** Field-level detail for validation failures. */
  fields?: Record<string, string>;
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "RATE_LIMITED"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL";

/** A scored search hit. */
export interface SearchHit {
  slug: string;
  title: string;
  epithet: string;
  category: CategoryId;
  score: number;
  /** Which field produced the strongest match, for UI explanation. */
  matchedOn: string;
  /** Description with matched terms wrapped in <mark>, pre-escaped. */
  highlight: string;
}
