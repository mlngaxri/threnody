import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntryCard } from "@/components/EntryCard";
import { FilterBar } from "@/components/FilterBar";
import { EmptyState } from "@/components/States";
import {
  getCategories,
  getCategory,
  getSuggestions,
  getTags,
  isValidFidelity,
  isValidSort,
  queryEntries,
} from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    return {
      title: "Category not found",
      description: "This category is not part of the archive taxonomy.",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      type: "website",
      title: `${category.name} | THRENODY`,
      description: category.tagline,
      url: absoluteUrl(`/categories/${category.slug}`),
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} | THRENODY`,
      description: category.tagline,
    },
  };
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const category = getCategory(slug);
  if (!category) notFound();

  const rawFidelity = single(query.fidelity);
  const rawSort = single(query.sort);
  const rawTag = single(query.tag);
  const sort = rawSort && isValidSort(rawSort) ? rawSort : "editorial";
  const fidelity = rawFidelity && isValidFidelity(rawFidelity) ? rawFidelity : rawFidelity;

  const results = queryEntries({ category: category.id, tag: rawTag, fidelity, sort });

  // Tags are scoped to what actually exists inside this category, so the filter
  // bar can never offer a combination that returns nothing.
  const withinCategory = queryEntries({ category: category.id });
  const tagCounts = new Map<string, number>();
  for (const entry of withinCategory) {
    for (const tag of entry.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const tags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const active = {
    category: category.slug,
    tag: rawTag ?? "",
    fidelity: rawFidelity ?? "",
    sort,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: absoluteUrl(`/categories/${category.slug}`),
    isPartOf: { "@type": "WebSite", name: "THRENODY", url: absoluteUrl("/") },
    hasPart: results.map((entry) => ({
      "@type": "Article",
      headline: entry.title,
      url: absoluteUrl(`/entries/${entry.slug}`),
    })),
  };

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb">
        <ol
          style={{
            display: "flex",
            gap: "var(--sp-2)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--step--2)",
            color: "var(--text-faint)",
          }}
        >
          <li>
            <Link href="/categories">Categories</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{category.name}</li>
        </ol>
      </nav>

      <h1
        style={{
          fontSize: "var(--step-5)",
          marginBlockStart: "var(--sp-5)",
          paddingInlineStart: "var(--sp-4)",
          borderInlineStart: `4px solid var(--accent-${category.accent})`,
        }}
      >
        {category.name}
      </h1>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "var(--step-2)",
          color: "var(--text-muted)",
          marginBlockStart: "var(--sp-3)",
        }}
      >
        {category.tagline}
      </p>
      <p className="measure" style={{ marginBlockStart: "var(--sp-5)" }}>
        {category.description}
      </p>

      <div style={{ marginBlockStart: "var(--sp-7)" }}>
        <FilterBar
          basePath={`/categories/${category.slug}`}
          active={active}
          categories={getCategories()}
          tags={tags}
          locked={["category"]}
          resultCount={results.length}
        />
      </div>

      {results.length === 0 ? (
        <div style={{ marginBlockStart: "var(--sp-6)" }}>
          <EmptyState
            title="Nothing in this category matches those filters."
            body={`${category.name} holds ${withinCategory.length} ${withinCategory.length === 1 ? "entry" : "entries"} in total. The combination you asked for is not among them.`}
            suggestions={getSuggestions(5)}
            suggestionHref={(value) => `/search?q=${encodeURIComponent(value)}`}
          />
          <p style={{ marginBlockStart: "var(--sp-5)" }}>
            <Link href={`/categories/${category.slug}`} className="btn">
              Show all of {category.name}
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid" style={{ marginBlockStart: "var(--sp-6)" }}>
          {results.map((entry) => (
            <EntryCard key={entry.slug} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
