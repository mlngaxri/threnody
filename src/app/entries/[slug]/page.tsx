import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlockRenderer } from "@/components/BlockRenderer";
import { FidelityBadge, FIDELITY_LABEL, FIDELITY_MEANING } from "@/components/FidelityBadge";
import { PrevNext } from "@/components/PrevNext";
import { ReconstructionPlayer } from "@/components/ReconstructionPlayer";
import { RelatedEntries } from "@/components/RelatedEntries";
import { WaveformFigure } from "@/components/WaveformFigure";
import {
  getCategories,
  getContributor,
  getEntry,
  getNeighbours,
  getRelated,
  isValidFidelity,
  isValidSort,
  publishedEntries,
} from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The archive is a fixed set. Any slug outside generateStaticParams is a real
 * 404 rather than an on-demand render, which also guarantees that a draft slug
 * can never be served by guessing its URL.
 */
export const dynamicParams = false;

/** Pre-render every published entry. Drafts are deliberately excluded. */
export function generateStaticParams() {
  return publishedEntries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getEntry(slug);

  if (!entry) {
    return {
      title: "Entry not found",
      description: "This entry is not in the archive.",
      robots: { index: false, follow: true },
    };
  }

  const url = absoluteUrl(`/entries/${entry.slug}`);

  return {
    title: entry.seo.metaTitle,
    description: entry.seo.metaDescription,
    keywords: entry.seo.keywords,
    alternates: { canonical: `/entries/${entry.slug}` },
    openGraph: {
      type: "article",
      title: entry.seo.metaTitle,
      description: entry.seo.metaDescription,
      url,
      publishedTime: entry.publishedAt,
      modifiedTime: entry.updatedAt,
      tags: entry.tags,
      authors: entry.contributorIds
        .map((id) => getContributor(id)?.name)
        .filter((name): name is string => Boolean(name)),
    },
    twitter: {
      card: "summary_large_image",
      title: entry.seo.metaTitle,
      description: entry.seo.metaDescription,
    },
    other: {
      "article:section": entry.category,
    },
  };
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function EntryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const entry = getEntry(slug);
  if (!entry) notFound();

  const categories = getCategories();
  const category = categories.find((c) => c.id === entry.category);

  // Prev and next follow the sequence the reader arrived with, reconstructed
  // from the query string, so navigating a filtered category stays inside it.
  const rawCategory = single(query.category);
  const rawSort = single(query.sort);
  const rawFidelity = single(query.fidelity);
  const rawTag = single(query.tag);
  const sequenceQuery = {
    category: rawCategory ? categories.find((c) => c.slug === rawCategory)?.id : undefined,
    tag: rawTag,
    fidelity: rawFidelity && isValidFidelity(rawFidelity) ? rawFidelity : undefined,
    sort: rawSort && isValidSort(rawSort) ? rawSort : ("editorial" as const),
  };

  const neighbours = getNeighbours(entry.slug, sequenceQuery);
  const related = getRelated(entry.slug, 3);
  const contributors = entry.contributorIds
    .map((id) => getContributor(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  const carried = new URLSearchParams(
    Object.fromEntries(
      Object.entries({
        category: rawCategory ?? "",
        tag: rawTag ?? "",
        fidelity: rawFidelity ?? "",
        sort: rawSort ?? "",
      }).filter(([, v]) => v),
    ),
  ).toString();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    alternativeHeadline: entry.epithet,
    description: entry.description,
    datePublished: entry.publishedAt,
    dateModified: entry.updatedAt,
    keywords: entry.tags.join(", "),
    articleSection: category?.name ?? entry.category,
    inLanguage: "en",
    url: absoluteUrl(`/entries/${entry.slug}`),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(`/entries/${entry.slug}`) },
    author: contributors.map((c) => ({
      "@type": "Person",
      name: c.name,
      jobTitle: c.role,
      affiliation: c.affiliation,
    })),
    publisher: { "@type": "Organization", name: "THRENODY" },
    contentLocation: {
      "@type": "Place",
      name: entry.provenance.place,
      geo: {
        "@type": "GeoCoordinates",
        latitude: entry.provenance.lat,
        longitude: entry.provenance.lon,
      },
    },
    citation: entry.sources.map((s) => `${s.label}, ${s.detail}, ${s.year}`),
  };

  return (
    <article data-fidelity={entry.fidelity}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--line)",
          position: "relative",
          overflow: "hidden",
          background: "var(--bg-raised)",
        }}
      >
        <div className="grain" aria-hidden="true" />
        <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
          <nav aria-label="Breadcrumb">
            <ol
              style={{
                display: "flex",
                gap: "var(--sp-2)",
                flexWrap: "wrap",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--step--2)",
                color: "var(--text-faint)",
              }}
            >
              <li>
                <Link href="/atlas">Atlas</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/categories/${category?.slug ?? ""}`}>
                  {category?.name ?? entry.category}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{entry.title}</li>
            </ol>
          </nav>

          <h1 style={{ fontSize: "var(--step-5)", marginBlockStart: "var(--sp-5)" }}>
            {entry.title}
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
            {entry.epithet}
          </p>

          <div
            style={{
              display: "flex",
              gap: "var(--sp-4)",
              alignItems: "center",
              flexWrap: "wrap",
              marginBlockStart: "var(--sp-5)",
            }}
          >
            <FidelityBadge fidelity={entry.fidelity} />
            <span className="eyebrow">Last heard {entry.provenance.lastHeard}</span>
            <span className="eyebrow">{entry.provenance.place}</span>
            <span className="eyebrow">{entry.readingMinutes} min read</span>
          </div>

          <div style={{ marginBlockStart: "var(--sp-6)", maxWidth: "64rem" }}>
            <WaveformFigure
              signature={entry.sound}
              seed={entry.slug}
              variant="waveform"
              height={180}
              label={`Waveform of the reconstruction of ${entry.title}. ${entry.sound.description}`}
            />
          </div>
        </div>
      </header>

      <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
        <div className="entry-layout">
          {/* Body */}
          <div>
            <p
              className="measure"
              style={{ fontSize: "var(--step-1)", fontFamily: "var(--font-display)" }}
            >
              {entry.description}
            </p>

            <div style={{ marginBlock: "var(--sp-6)" }}>
              <ReconstructionPlayer signature={entry.sound} title={entry.title} />
            </div>

            <BlockRenderer blocks={entry.body} entry={entry} />

            <PrevNext
              previous={neighbours.previous}
              next={neighbours.next}
              position={neighbours.position}
              total={neighbours.total}
              query={carried}
            />
          </div>

          {/* Apparatus */}
          <aside className="entry-layout__aside" aria-label="Entry apparatus">
            <section>
              <h2 className="eyebrow">Fidelity</h2>
              <div style={{ marginBlockStart: "var(--sp-3)" }}>
                <FidelityBadge fidelity={entry.fidelity} />
                <p
                  style={{
                    marginBlockStart: "var(--sp-3)",
                    fontSize: "var(--step--1)",
                    color: "var(--text-muted)",
                  }}
                >
                  {FIDELITY_MEANING[entry.fidelity]}
                </p>
              </div>
            </section>

            <section style={{ marginBlockStart: "var(--sp-6)" }}>
              <h2 className="eyebrow">Provenance</h2>
              <dl
                style={{
                  marginBlockStart: "var(--sp-3)",
                  display: "grid",
                  gap: "var(--sp-2)",
                  fontSize: "var(--step--1)",
                }}
              >
                <div>
                  <dt style={{ color: "var(--text-faint)" }}>Place</dt>
                  <dd>{entry.provenance.place}</dd>
                </div>
                <div>
                  <dt style={{ color: "var(--text-faint)" }}>Region</dt>
                  <dd>{entry.provenance.region}</dd>
                </div>
                <div>
                  <dt style={{ color: "var(--text-faint)" }}>Coordinates</dt>
                  <dd style={{ fontFamily: "var(--font-mono)" }}>
                    {entry.provenance.lat.toFixed(3)}, {entry.provenance.lon.toFixed(3)}
                  </dd>
                </div>
                <div>
                  <dt style={{ color: "var(--text-faint)" }}>First attested</dt>
                  <dd>{entry.provenance.firstAttested ?? "Not established"}</dd>
                </div>
                <div>
                  <dt style={{ color: "var(--text-faint)" }}>Last reliably heard</dt>
                  <dd>{entry.provenance.lastHeard}</dd>
                </div>
              </dl>
            </section>

            <section style={{ marginBlockStart: "var(--sp-6)" }}>
              <h2 className="eyebrow">Sources</h2>
              <ol
                style={{
                  marginBlockStart: "var(--sp-3)",
                  display: "grid",
                  gap: "var(--sp-3)",
                  fontSize: "var(--step--1)",
                }}
              >
                {entry.sources.map((source, i) => (
                  <li key={i} style={{ paddingInlineStart: "var(--sp-3)", borderInlineStart: "1px solid var(--line)" }}>
                    <strong style={{ fontWeight: 500 }}>{source.label}</strong>
                    <span style={{ display: "block", color: "var(--text-muted)" }}>
                      {source.detail}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-faint)" }}>
                      {source.year}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            {contributors.length > 0 ? (
              <section style={{ marginBlockStart: "var(--sp-6)" }}>
                <h2 className="eyebrow">Contributors</h2>
                <ul style={{ marginBlockStart: "var(--sp-3)", display: "grid", gap: "var(--sp-3)" }}>
                  {contributors.map((contributor) => (
                    <li key={contributor.id} style={{ fontSize: "var(--step--1)" }}>
                      <Link href={`/contributors#${contributor.id}`}>{contributor.name}</Link>
                      <span style={{ display: "block", color: "var(--text-faint)" }}>
                        {contributor.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section style={{ marginBlockStart: "var(--sp-6)" }}>
              <h2 className="eyebrow">Tags</h2>
              <ul className="chips" style={{ marginBlockStart: "var(--sp-3)" }}>
                {entry.tags.map((tag) => (
                  <li key={tag}>
                    <Link className="chip" href={`/atlas?tag=${encodeURIComponent(tag)}`}>
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section style={{ marginBlockStart: "var(--sp-6)" }}>
              <h2 className="eyebrow">Record</h2>
              <dl
                style={{
                  marginBlockStart: "var(--sp-3)",
                  fontSize: "var(--step--2)",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-faint)",
                  display: "grid",
                  gap: "var(--sp-2)",
                }}
              >
                <div>
                  <dt style={{ display: "inline" }}>Published </dt>
                  <dd style={{ display: "inline" }}>{entry.publishedAt}</dd>
                </div>
                <div>
                  <dt style={{ display: "inline" }}>Updated </dt>
                  <dd style={{ display: "inline" }}>{entry.updatedAt}</dd>
                </div>
                <div>
                  <dt style={{ display: "inline" }}>Grade </dt>
                  <dd style={{ display: "inline" }}>{FIDELITY_LABEL[entry.fidelity]}</dd>
                </div>
              </dl>
              <p style={{ marginBlockStart: "var(--sp-4)", fontSize: "var(--step--2)" }}>
                <Link href={`/api/content/${entry.slug}`}>View this entry as JSON</Link>
              </p>
            </section>
          </aside>
        </div>

        <RelatedEntries related={related} />
      </div>
    </article>
  );
}
