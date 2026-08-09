import type { ApiError, ApiErrorCode, ApiResponse } from "./types.ts";

/**
 * Validation, response envelopes and rate limiting.
 * Zero dependencies, so every rule here is unit-testable under plain Node and
 * behaves identically inside a Next.js route handler.
 */

/* -------------------------------------------------------------------------- */
/* Response envelopes                                                          */
/* -------------------------------------------------------------------------- */

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return meta ? { ok: true, data, meta } : { ok: true, data };
}

export function fail(
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): ApiResponse<never> {
  const error: ApiError = { code, message };
  if (fields && Object.keys(fields).length > 0) error.fields = fields;
  return { ok: false, error };
}

/** Canonical HTTP status for each error code. */
export const STATUS_FOR_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_FAILED: 422,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  RATE_LIMITED: 429,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL: 500,
};

/* -------------------------------------------------------------------------- */
/* Query parameter coercion                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Parse an integer query parameter within bounds.
 * Returns the fallback for absent values and null for present-but-invalid ones,
 * so a caller can distinguish "not supplied" from "supplied as nonsense".
 */
export function parseIntParam(
  raw: string | null | undefined,
  opts: { min: number; max: number; fallback: number },
): number | null {
  if (raw === null || raw === undefined || raw === "") return opts.fallback;
  if (!/^-?\d+$/.test(raw.trim())) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return null;
  if (value < opts.min || value > opts.max) return null;
  return value;
}

/** Parse a boolean-ish query parameter. */
export function parseBoolParam(raw: string | null | undefined): boolean | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return null;
}

/** Slugs are lowercase, hyphen-separated, and bounded in length. */
export function isValidSlug(raw: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw) && raw.length <= 80;
}

/* -------------------------------------------------------------------------- */
/* Contact submission                                                          */
/* -------------------------------------------------------------------------- */

export interface ContactSubmission {
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  /** Optional slug the enquiry refers to. */
  entrySlug?: string;
  /** Honeypot field; must be empty. Never shown to real users. */
  website?: string;
}

export type ContactSubject = "contribute" | "correction" | "permissions" | "general";

const SUBJECTS: ContactSubject[] = ["contribute", "correction", "permissions", "general"];

export const CONTACT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 254,
  messageMin: 20,
  messageMax: 2000,
  /** Whole-body cap, enforced before parsing. */
  maxBodyBytes: 16 * 1024,
} as const;

/**
 * Deliberately conservative email check. Full RFC 5322 compliance is not the
 * goal; rejecting obviously malformed input without rejecting valid addresses is.
 */
const EMAIL_RE = /^[^\s@,;:<>()[\]\\]+@[^\s@.,;:<>()[\]\\]+(?:\.[^\s@.,;:<>()[\]\\]+)+$/;

export interface ValidationResult {
  valid: boolean;
  fields: Record<string, string>;
  value?: ContactSubmission;
}

/**
 * Validate a contact submission.
 * Returns every field error at once rather than stopping at the first, so the
 * form can announce a complete list to a screen reader in a single live region
 * update.
 */
export function validateContact(input: unknown): ValidationResult {
  const fields: Record<string, string> = {};

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { valid: false, fields: { _form: "Expected a JSON object." } };
  }

  const body = input as Record<string, unknown>;

  // Honeypot. Silently invalid: a real user never sees or fills this.
  const website = typeof body.website === "string" ? body.website.trim() : "";
  if (website.length > 0) {
    return { valid: false, fields: { _form: "Submission rejected." } };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (name.length === 0) {
    fields.name = "Please enter your name.";
  } else if (name.length < CONTACT_LIMITS.nameMin) {
    fields.name = `Name must be at least ${CONTACT_LIMITS.nameMin} characters.`;
  } else if (name.length > CONTACT_LIMITS.nameMax) {
    fields.name = `Name must be ${CONTACT_LIMITS.nameMax} characters or fewer.`;
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (email.length === 0) {
    fields.email = "Please enter an email address.";
  } else if (email.length > CONTACT_LIMITS.emailMax) {
    fields.email = "That email address is too long.";
  } else if (!EMAIL_RE.test(email)) {
    fields.email = "Please enter a valid email address, for example name@example.org.";
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  if (subject.length === 0) {
    fields.subject = "Please choose a subject.";
  } else if (!SUBJECTS.includes(subject as ContactSubject)) {
    fields.subject = `Subject must be one of: ${SUBJECTS.join(", ")}.`;
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length === 0) {
    fields.message = "Please enter a message.";
  } else if (message.length < CONTACT_LIMITS.messageMin) {
    fields.message = `Message must be at least ${CONTACT_LIMITS.messageMin} characters. You have ${message.length}.`;
  } else if (message.length > CONTACT_LIMITS.messageMax) {
    fields.message = `Message must be ${CONTACT_LIMITS.messageMax} characters or fewer. You have ${message.length}.`;
  }

  let entrySlug: string | undefined;
  if (body.entrySlug !== undefined && body.entrySlug !== null && body.entrySlug !== "") {
    if (typeof body.entrySlug !== "string" || !isValidSlug(body.entrySlug)) {
      fields.entrySlug = "Referenced entry is not a valid slug.";
    } else {
      entrySlug = body.entrySlug;
    }
  }

  if (Object.keys(fields).length > 0) {
    return { valid: false, fields };
  }

  return {
    valid: true,
    fields: {},
    value: { name, email, subject: subject as ContactSubject, message, entrySlug },
  };
}

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                               */
/* -------------------------------------------------------------------------- */

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Fixed-window in-memory rate limiter.
 *
 * Honest about its limits: on serverless this is per-instance, so it raises the
 * cost of abuse rather than eliminating it. Combined with the honeypot and the
 * body-size cap it is proportionate for a contact form. A durable store would
 * be required for a hard guarantee.
 */
export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(key: string, now: number = Date.now()): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfterSec: number;
  } {
    this.sweep(now);
    const bucket = this.buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      const resetAt = now + this.windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.limit - 1, resetAt, retryAfterSec: 0 };
    }

    if (bucket.count >= this.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: bucket.resetAt,
        retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      };
    }

    bucket.count += 1;
    return {
      allowed: true,
      remaining: this.limit - bucket.count,
      resetAt: bucket.resetAt,
      retryAfterSec: 0,
    };
  }

  /** Drop expired buckets so the map cannot grow without bound. */
  private sweep(now: number): void {
    if (this.buckets.size < 500) return;
    for (const [key, bucket] of this.buckets) {
      if (now >= bucket.resetAt) this.buckets.delete(key);
    }
  }

  reset(): void {
    this.buckets.clear();
  }
}

/** Five submissions per ten minutes per client key. */
export const contactLimiter = new RateLimiter(5, 10 * 60 * 1000);

/**
 * Derive a rate-limit key from request headers.
 * Never logged and never returned to the client.
 */
export function clientKey(headers: {
  get(name: string): string | null;
}): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "anonymous";
}
