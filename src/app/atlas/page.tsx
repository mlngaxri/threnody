import type { Metadata } from "next";
import Link from "next/link";
import { EntryCard } from "@/components/EntryCard";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/States";
import {
  getCategories,
  getSuggestions,
  getTags,
  isValidFidelity,
  isValidSort,
  queryEntries,
} from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "The atlas",
  description:
    "Every entry in THRENODY, filterable by category, tag and fidelity grade, and sortable by when the sound was last heard. Each filtered view has its own shareable address.",
  alternates: { canonical: "/atlas" },
  openGraph: {
    title: "The atlas | THRENODY",
    description: "Every sound in the archive, filterable by category, tag and fidelity grade.",
    url: absoluteUrl("/atlas"),
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function AtlasPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const categories = getCategories();
  const tags = getTags();

  const rawCategory = single(params.category);
  const rawTag = single(params.tag);
  const rawFidelity = single(params.fidelity);
  const rawSort = single(params.sort);
  const rawFeatured = single(params.featured);

  // An unknown filter value is passed through rather than dropped, so the
  // result is an honest empty state instead of silently showing everything and
  // pretending the filter was never applied.
  const categoryId = categories.find((c) => c.slug === rawCategory)?.id;
  const sort = rawSort && isValidSort(rawSort) ? rawSort : "editorial";
  const fidelity = rawFidelity && isValidFidelity(rawFidelity) ? rawFidelity : rawFidelity;

  const results = queryEntries({
    category: rawCategory ? (categoryId ?? "__unknown__") : undefined,
    tag: rawTag,
    fidelity,
    featured: rawFeatured === "true" ? true : undefined,
    sort,
  });

  const active = {
    category: rawCategory ?? "",
    tag: rawTag ?? "",
    fidelity: rawFidelity ?? "",
    sort,
    featured: rawFeatured === "true" ? "true" : "",
  };

  const queryString = new URLSearchParams(
    Object.fromEntries(Object.entries(active).filter(([, v]) => v)),
  ).toString();

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">The complete archive</p>
      <h1 style={{ fontSize: "var(--step-5)", marginBlockStart: "var(--sp-4)" }}>The atlas</h1>
      <p className="measure" style={{ marginBlockStart: "var(--sp-4)", color: "var(--text-muted)" }}>
        Every entry, arranged however you need it. Filters live in the address bar, so any view you
        build here can be bookmarked, shared or cited exactly as you left it.
      </p>

      <div style={{ marginBlockStart: "var(--sp-6)" }}>
        <FilterBar
          basePath="/atlas"
          active={active}
          categories={categories}
          tags={tags}
          resultCount={results.length}
        />
      </div>

      {results.length === 0 ? (
        <div style={{ marginBlockStart: "var(--sp-6)" }}>
          <EmptyState
            title="No entry matches that combination."
            body="The filters are working correctly, this corner of the archive is simply empty. That happens often here: the archive is deliberately small and deeply documented rather than broad and thin."
            suggestions={getSuggestions(5)}
            suggestionHref={(value) => `/search?q=${encodeURIComponent(value)}`}
          />
          <p style={{ marginBlockStart: "var(--sp-5)" }}>
            <Link href="/atlas" className="btn">
              Clear all filters
            </Link>
          </p>
        </div>
      ) : (
        <>
          <div className="grid" style={{ marginBlockStart: "var(--sp-6)" }}>
            {results.map((entry) => (
              <EntryCard key={entry.slug} entry={entry} />
            ))}
          </div>
          <p
            className="eyebrow"
            style={{ marginBlockStart: "var(--sp-6)", color: "var(--text-faint)" }}
          >
            Opening any entry from here keeps this ordering, so previous and next follow the sequence
            you built rather than jumping elsewhere in the archive.
          </p>
          {queryString ? (
            <p className="visually-hidden">Current view address: /atlas?{queryString}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
