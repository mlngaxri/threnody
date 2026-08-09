import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, LoadingGrid } from "@/components/States";
import { FIDELITY_LABEL } from "@/components/FidelityBadge";
import { getCategories, getEntry, getSuggestions, searchEntries } from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Search the archive",
  description:
    "Search THRENODY by title, description, place, tag, contributor or the written description of the sound itself. Results say which field matched and why.",
  alternates: { canonical: "/search" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Search the archive | THRENODY",
    description: "Search by title, place, tag, contributor or the description of the sound itself.",
    url: absoluteUrl("/search"),
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = (single(params.q) ?? "").trim();

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">Discovery</p>
      <h1 style={{ fontSize: "var(--step-5)", marginBlockStart: "var(--sp-4)" }}>
        Search the archive
      </h1>
      <p className="measure" style={{ marginBlockStart: "var(--sp-4)", color: "var(--text-muted)" }}>
        Searching covers titles, descriptions, places, regions, tags, contributors and the written
        description of each sound. Diacritics are folded, so Kaua&#699;i and Kauai find the same
        entry.
      </p>

      {/* A plain GET form. It works with JavaScript disabled, produces a
          shareable URL, and needs no client-side state. */}
      <form
        role="search"
        action="/search"
        method="get"
        style={{
          marginBlockStart: "var(--sp-6)",
          display: "flex",
          gap: "var(--sp-3)",
          flexWrap: "wrap",
          alignItems: "flex-end",
        }}
      >
        <div className="field" style={{ flex: "1 1 22rem" }}>
          <label className="field__label" htmlFor="q">
            Search terms
          </label>
          <input
            className="input"
            type="search"
            id="q"
            name="q"
            defaultValue={q}
            placeholder="thylacine, Aral, linotype, foghorn"
            autoComplete="off"
            aria-describedby="search-hint"
          />
          <span className="field__hint" id="search-hint">
            Multiple words narrow the result. Partial words match from the start.
          </span>
        </div>
        <button type="submit" className="btn btn--primary">
          Search
        </button>
      </form>

      <Suspense fallback={<LoadingGrid count={3} label="Searching the archive" />}>
        <Results q={q} />
      </Suspense>
    </div>
  );
}

function Results({ q }: { q: string }) {
  const categories = getCategories();

  if (!q) {
    const suggestions = getSuggestions(6);
    return (
      <section aria-labelledby="results-heading" style={{ marginBlockStart: "var(--sp-7)" }}>
        <h2 id="results-heading" className="eyebrow">
          Nothing searched yet
        </h2>
        <div style={{ marginBlockStart: "var(--sp-4)" }}>
          <EmptyState
            title="Start anywhere."
            body="Every suggestion below is checked against the archive before it is offered, so none of them lead to an empty result."
            suggestions={suggestions}
            suggestionHref={(value) => `/search?q=${encodeURIComponent(value)}`}
          />
        </div>
      </section>
    );
  }

  const hits = searchEntries(q, 20);

  if (hits.length === 0) {
    return (
      <section aria-labelledby="results-heading" style={{ marginBlockStart: "var(--sp-7)" }}>
        <h2 id="results-heading" className="eyebrow" aria-live="polite">
          No results for {q}
        </h2>
        <div style={{ marginBlockStart: "var(--sp-4)" }}>
          <EmptyState
            title="Nothing in the archive answers to that."
            body="This archive is deliberately small: fourteen entries, deeply documented, rather than a thin index of thousands. A term that returns nothing here may simply be outside what has been catalogued so far."
            suggestions={getSuggestions(6)}
            suggestionHref={(value) => `/search?q=${encodeURIComponent(value)}`}
          />
        </div>
        <p style={{ marginBlockStart: "var(--sp-5)" }}>
          <Link href="/contact" className="btn">
            Tell us what is missing
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="results-heading" style={{ marginBlockStart: "var(--sp-7)" }}>
      <h2 id="results-heading" className="eyebrow" aria-live="polite">
        {hits.length} {hits.length === 1 ? "result" : "results"} for {q}
      </h2>

      <ol style={{ marginBlockStart: "var(--sp-5)", display: "grid", gap: "var(--sp-4)" }}>
        {hits.map((hit) => {
          const entry = getEntry(hit.slug);
          const category = categories.find((c) => c.id === hit.category);
          return (
            <li
              key={hit.slug}
              data-fidelity={entry?.fidelity}
              style={{
                padding: "var(--sp-5)",
                border: "1px solid var(--line)",
                borderInlineStart: "3px solid var(--grade, var(--line-strong))",
                background: "var(--bg-raised)",
              }}
            >
              <h3 style={{ fontSize: "var(--step-2)" }}>
                <Link href={`/entries/${hit.slug}`} style={{ textDecoration: "none" }}>
                  {hit.title}
                </Link>
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  color: "var(--text-muted)",
                  marginBlockStart: "var(--sp-2)",
                }}
              >
                {hit.epithet}
              </p>

              {/* highlight is escaped in the repository before <mark> is
                  inserted, so no user input can reach the DOM as markup. */}
              <p
                style={{ marginBlockStart: "var(--sp-3)", color: "var(--text-muted)" }}
                dangerouslySetInnerHTML={{ __html: hit.highlight }}
              />

              <p className="eyebrow" style={{ marginBlockStart: "var(--sp-4)" }}>
                Matched on {hit.matchedOn}
                {category ? ` in ${category.name}` : ""}
                {entry ? ` / ${FIDELITY_LABEL[entry.fidelity]}` : ""}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
