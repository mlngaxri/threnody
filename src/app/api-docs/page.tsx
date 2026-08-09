import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "API",
  description:
    "THRENODY publishes its whole catalogue as a documented read-only JSON API, with a consistent response envelope, typed error codes and honest status codes.",
  alternates: { canonical: "/api-docs" },
  openGraph: {
    title: "API | THRENODY",
    description: "The archive as a documented read-only JSON API.",
    url: absoluteUrl("/api-docs"),
  },
};

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  params?: Array<{ name: string; type: string; note: string }>;
  errors: string[];
  example: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/health",
    summary:
      "Liveness and content integrity. Reports uptime, entry counts and whether the content model passes its own invariants.",
    errors: ["500 INTERNAL if the content model fails to load"],
    example: "/api/health",
  },
  {
    method: "GET",
    path: "/api/content",
    summary:
      "The catalogue. Supports the same filters and sorts as the atlas, plus pagination. Draft entries are never returned.",
    params: [
      { name: "category", type: "string", note: "Category slug. 400 if unknown." },
      { name: "tag", type: "string", note: "Exact tag match, case insensitive." },
      { name: "fidelity", type: "enum", note: "One of the four grades. 400 if unknown." },
      { name: "featured", type: "boolean", note: "true or false. Anything else is a 400." },
      { name: "sort", type: "enum", note: "editorial, recent, oldest-sound, newest-sound, title." },
      { name: "limit", type: "integer", note: "1 to 50. Defaults to 12." },
      { name: "offset", type: "integer", note: "0 or greater. Defaults to 0." },
    ],
    errors: ["400 BAD_REQUEST for an unknown or malformed parameter"],
    example: "/api/content?category=obsolete-machines&sort=title&limit=5",
  },
  {
    method: "GET",
    path: "/api/content/[slug]",
    summary:
      "A single entry with its full body, sound signature, provenance, sources, neighbours and related entries.",
    params: [{ name: "slug", type: "string", note: "Lowercase, hyphenated. 400 if malformed." }],
    errors: ["400 BAD_REQUEST for a malformed slug", "404 NOT_FOUND if no published entry matches"],
    example: "/api/content/thylacine-final-cry",
  },
  {
    method: "GET",
    path: "/api/categories",
    summary: "The six categories with live entry counts.",
    errors: ["500 INTERNAL"],
    example: "/api/categories",
  },
  {
    method: "GET",
    path: "/api/search",
    summary:
      "Full text search across titles, descriptions, places, tags, contributors and sound descriptions. Returns which field matched and a pre-escaped highlight fragment.",
    params: [
      { name: "q", type: "string", note: "Required, 1 to 120 characters. 400 if missing or empty." },
      { name: "limit", type: "integer", note: "1 to 50. Defaults to 10." },
    ],
    errors: ["400 BAD_REQUEST for a missing or oversized query"],
    example: "/api/search?q=foghorn",
  },
  {
    method: "POST",
    path: "/api/contact",
    summary:
      "Submit an enquiry or correction. Validates every field and returns all field errors at once rather than stopping at the first.",
    params: [
      { name: "name", type: "string", note: "2 to 80 characters." },
      { name: "email", type: "string", note: "Up to 254 characters, must parse as an address." },
      { name: "subject", type: "enum", note: "contribute, correction, permissions, general." },
      { name: "message", type: "string", note: "20 to 2000 characters." },
      { name: "entrySlug", type: "string", note: "Optional. Must be a published entry." },
    ],
    errors: [
      "400 BAD_REQUEST for malformed JSON",
      "422 VALIDATION for field errors, with a fields object",
      "413 PAYLOAD_TOO_LARGE above 16 KB",
      "429 RATE_LIMITED after 5 submissions in 10 minutes",
    ],
    example: "curl -X POST /api/contact -d '{...}'",
  },
  {
    method: "GET",
    path: "/api/site-config",
    summary: "Site name, tagline, locales, featured entry and the year range the archive covers.",
    errors: ["500 INTERNAL"],
    example: "/api/site-config",
  },
  {
    method: "GET",
    path: "/api/timeline",
    summary: "Entries projected onto century bands for the extinction timeline.",
    errors: ["500 INTERNAL"],
    example: "/api/timeline",
  },
];

export default function ApiDocsPage() {
  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">Interface</p>
      <h1 style={{ fontSize: "var(--step-5)", marginBlockStart: "var(--sp-4)" }}>
        The archive as an API
      </h1>
      <p className="measure" style={{ marginBlockStart: "var(--sp-4)", color: "var(--text-muted)" }}>
        An archive that cannot be queried by machine is a brochure. Everything the website knows is
        available as JSON, read only, no key required, no rate limit on reads.
      </p>

      <section aria-labelledby="envelope" style={{ marginBlockStart: "var(--sp-7)" }}>
        <h2 id="envelope" style={{ fontSize: "var(--step-3)" }}>
          Response envelope
        </h2>
        <p className="measure" style={{ marginBlockStart: "var(--sp-3)" }}>
          Every response, success or failure, uses the same shape. Clients can branch on one boolean
          and never have to guess.
        </p>
        <pre
          style={{
            marginBlockStart: "var(--sp-4)",
            padding: "var(--sp-4)",
            overflowX: "auto",
            border: "1px solid var(--line)",
            background: "var(--bg-sunken)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--step--1)",
          }}
        >
          <code>{`{ "ok": true,  "data": { ... }, "meta": { ... } }
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "...", "fields": { ... } } }`}</code>
        </pre>
        <p className="measure" style={{ marginBlockStart: "var(--sp-4)" }}>
          Error codes are BAD_REQUEST, VALIDATION, NOT_FOUND, METHOD_NOT_ALLOWED,
          PAYLOAD_TOO_LARGE, RATE_LIMITED and INTERNAL. Messages are written for humans and never
          contain a stack trace, a file path or an environment value.
        </p>
      </section>

      <section aria-labelledby="endpoints" style={{ marginBlockStart: "var(--sp-8)" }}>
        <h2 id="endpoints" style={{ fontSize: "var(--step-3)" }}>
          Endpoints
        </h2>

        <div style={{ marginBlockStart: "var(--sp-6)", display: "grid", gap: "var(--sp-7)" }}>
          {ENDPOINTS.map((endpoint) => (
            <article key={endpoint.path} style={{ borderTop: "1px solid var(--line-strong)", paddingBlockStart: "var(--sp-4)" }}>
              <h3 style={{ fontFamily: "var(--font-mono)", fontSize: "var(--step-1)" }}>
                <span style={{ color: "var(--accent)" }}>{endpoint.method}</span> {endpoint.path}
              </h3>
              <p className="measure" style={{ marginBlockStart: "var(--sp-3)" }}>
                {endpoint.summary}
              </p>

              {endpoint.params ? (
                <div style={{ marginBlockStart: "var(--sp-4)", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--step--1)" }}>
                    <caption className="visually-hidden">
                      Parameters for {endpoint.method} {endpoint.path}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" style={{ textAlign: "left", padding: "var(--sp-2)", borderBottom: "1px solid var(--line)" }}>
                          Parameter
                        </th>
                        <th scope="col" style={{ textAlign: "left", padding: "var(--sp-2)", borderBottom: "1px solid var(--line)" }}>
                          Type
                        </th>
                        <th scope="col" style={{ textAlign: "left", padding: "var(--sp-2)", borderBottom: "1px solid var(--line)" }}>
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.params.map((param) => (
                        <tr key={param.name}>
                          <td style={{ padding: "var(--sp-2)", fontFamily: "var(--font-mono)", borderBottom: "1px solid var(--line)" }}>
                            {param.name}
                          </td>
                          <td style={{ padding: "var(--sp-2)", color: "var(--text-faint)", borderBottom: "1px solid var(--line)" }}>
                            {param.type}
                          </td>
                          <td style={{ padding: "var(--sp-2)", color: "var(--text-muted)", borderBottom: "1px solid var(--line)" }}>
                            {param.note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <p className="eyebrow" style={{ marginBlockStart: "var(--sp-4)" }}>
                Errors
              </p>
              <ul style={{ marginBlockStart: "var(--sp-2)", color: "var(--text-muted)", fontSize: "var(--step--1)" }}>
                {endpoint.errors.map((error) => (
                  <li key={error} style={{ fontFamily: "var(--font-mono)" }}>
                    {error}
                  </li>
                ))}
              </ul>

              {endpoint.method === "GET" ? (
                <p style={{ marginBlockStart: "var(--sp-4)" }}>
                  <a className="chip" href={endpoint.example}>
                    Try it: {endpoint.example}
                  </a>
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <p style={{ marginBlockStart: "var(--sp-8)" }}>
        <Link href="/atlas" className="btn">
          Back to the atlas
        </Link>
      </p>
    </div>
  );
}
