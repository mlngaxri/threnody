import type { Metadata } from "next";
import Link from "next/link";
import { EntryCard } from "@/components/EntryCard";
import { getContributors, publishedEntries } from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contributors",
  description:
    "The bioacousticians, conservators, ethnomusicologists and engineers who built the reconstructions in THRENODY, and the entries each of them is answerable for.",
  alternates: { canonical: "/contributors" },
  openGraph: {
    title: "Contributors | THRENODY",
    description: "The people answerable for each reconstruction in the archive.",
    url: absoluteUrl("/contributors"),
  },
};

export default function ContributorsPage() {
  const contributors = getContributors();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Contributors",
    url: absoluteUrl("/contributors"),
    about: contributors.map((c) => ({
      "@type": "Person",
      name: c.name,
      jobTitle: c.role,
      affiliation: { "@type": "Organization", name: c.affiliation },
    })),
  };

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <p className="eyebrow">Attribution</p>
      <h1 style={{ fontSize: "var(--step-5)", marginBlockStart: "var(--sp-4)" }}>
        Who is answerable
      </h1>
      <p className="measure" style={{ marginBlockStart: "var(--sp-4)", color: "var(--text-muted)" }}>
        Every reconstruction carries a name. Not a byline for credit, but an answer to the question
        of who made the judgement calls, so that a disputed grade has someone to dispute it with.
      </p>

      <div style={{ marginBlockStart: "var(--sp-8)", display: "grid", gap: "var(--sp-8)" }}>
        {contributors.map((contributor) => {
          const theirs = publishedEntries.filter((e) =>
            e.contributorIds.includes(contributor.id),
          );
          return (
            <section key={contributor.id} aria-labelledby={`c-${contributor.id}`}>
              <div
                style={{
                  paddingBlockEnd: "var(--sp-4)",
                  borderBottom: "1px solid var(--line-strong)",
                }}
              >
                <h2 id={`c-${contributor.id}`} style={{ fontSize: "var(--step-3)" }}>
                  {contributor.name}
                </h2>
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--step--2)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-faint)",
                    marginBlockStart: "var(--sp-2)",
                  }}
                >
                  {contributor.role} / {contributor.affiliation}
                </p>
              </div>

              <p className="measure" style={{ marginBlockStart: "var(--sp-4)" }}>
                {contributor.bio}
              </p>

              <p className="eyebrow" style={{ marginBlockStart: "var(--sp-5)" }}>
                {theirs.length} {theirs.length === 1 ? "entry" : "entries"} in the archive
              </p>

              {theirs.length === 0 ? (
                <p style={{ marginBlockStart: "var(--sp-3)", color: "var(--text-muted)" }}>
                  Nothing published yet. Work in progress is not listed until it clears review.
                </p>
              ) : (
                <div className="grid" style={{ marginBlockStart: "var(--sp-4)" }}>
                  {theirs.map((entry) => (
                    <EntryCard key={entry.slug} entry={entry} compact />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p style={{ marginBlockStart: "var(--sp-8)" }}>
        <Link href="/method" className="btn">
          Read the method they work to
        </Link>
      </p>
    </div>
  );
}
