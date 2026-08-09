import Link from "next/link";
import type { Metadata } from "next";
import { EntryCard } from "@/components/EntryCard";
import { FidelityBadge, FIDELITY_MEANING } from "@/components/FidelityBadge";
import { WaveformFigure } from "@/components/WaveformFigure";
import {
  getCategories,
  getEntry,
  getSiteConfig,
  getTimeline,
  publishedEntries,
  queryEntries,
} from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";
import type { Fidelity } from "@/lib/types";

export const metadata: Metadata = {
  title: "An atlas of sounds that no longer exist",
  description:
    "THRENODY maps sound that has left the world: extinct animal calls, silenced landscapes, obsolete machinery, abandoned rituals, unplayed instruments and dead radio signals. Each one is reconstructed, and each says plainly how much is evidence.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "THRENODY, an atlas of sounds that no longer exist",
    description:
      "An acoustic archaeology archive. Every reconstruction states how much of what you hear is evidence and how much is inference.",
    url: absoluteUrl("/"),
  },
};

const GRADES: Fidelity[] = ["field-recording", "restored", "reconstructed", "speculative"];

export default function HomePage() {
  const config = getSiteConfig();
  const featured = getEntry(config.featuredSlug) ?? publishedEntries[0];
  const recent = queryEntries({ sort: "recent" }).slice(0, 6);
  const categories = getCategories();
  const timeline = getTimeline();
  const oldest = Math.min(...publishedEntries.map((e) => e.provenance.lastHeard));
  const newest = Math.max(...publishedEntries.map((e) => e.provenance.lastHeard));

  const gradeCounts = GRADES.map((grade) => ({
    grade,
    count: publishedEntries.filter((e) => e.fidelity === grade).length,
  }));

  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Landing statement. The concept has to land in one screen.         */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="hero"
        aria-labelledby="hero-heading"
        style={{
          minHeight: "min(88dvh, 60rem)",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--line)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="shell" style={{ paddingBlock: "var(--sp-9)", width: "100%" }}>
          <p className="eyebrow">Acoustic archaeology, est. in the year the last one was heard</p>

          <h1
            id="hero-heading"
            style={{
              fontSize: "var(--step-6)",
              marginBlockStart: "var(--sp-5)",
              letterSpacing: "-0.03em",
            }}
          >
            An atlas of sounds
            <br />
            that no longer exist.
          </h1>

          <p
            className="measure"
            style={{
              marginBlockStart: "var(--sp-6)",
              fontSize: "var(--step-1)",
              color: "var(--text-muted)",
              fontFamily: "var(--font-display)",
            }}
          >
            Extinction is usually shown as an absence of bodies. This archive treats it as an absence
            of sound. {config.totalEntries} entries, spanning {config.yearRange.earliest} to{" "}
            {config.yearRange.latest}, each rebuilt closely enough to be heard again, and each
            labelled with exactly how much of it we actually know.
          </p>

          <div
            style={{
              display: "flex",
              gap: "var(--sp-4)",
              marginBlockStart: "var(--sp-7)",
              flexWrap: "wrap",
            }}
          >
            <Link href="/atlas" className="btn btn--primary">
              Enter the atlas
            </Link>
            <Link href={`/entries/${featured?.slug ?? ""}`} className="btn">
              Begin with one sound
            </Link>
          </div>

          {/* Live index of the archive, rendered from data, not decoration. */}
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(10rem, 45%), 1fr))",
              gap: "var(--sp-5)",
              marginBlockStart: "var(--sp-8)",
              paddingBlockStart: "var(--sp-5)",
              borderTop: "1px solid var(--line)",
              maxWidth: "52rem",
            }}
          >
            <div>
              <dt className="eyebrow">Entries</dt>
              <dd style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-3)" }}>
                {config.totalEntries}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Earliest silence</dt>
              <dd style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-3)" }}>
                {oldest}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Most recent</dt>
              <dd style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-3)" }}>
                {newest}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">Categories</dt>
              <dd style={{ fontFamily: "var(--font-display)", fontSize: "var(--step-3)" }}>
                {categories.length}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* The fidelity scale, stated before anything is heard.              */}
      {/* ---------------------------------------------------------------- */}
      <section
        aria-labelledby="fidelity-heading"
        className="shell"
        style={{ paddingBlock: "var(--sp-9)" }}
      >
        <p className="eyebrow">The one rule</p>
        <h2 id="fidelity-heading" style={{ fontSize: "var(--step-4)", marginBlockStart: "var(--sp-4)" }}>
          Nothing here pretends to be a recording.
        </h2>
        <p className="measure" style={{ marginBlockStart: "var(--sp-5)", color: "var(--text-muted)" }}>
          Most of these sounds were never recorded. Some were, and the tape rotted. A reconstruction
          that hides which is which is not an archive, it is a story. So every entry carries a grade,
          and the grade changes how the entry looks, not just what it says.
        </p>

        <ul
          style={{
            display: "grid",
            gap: "var(--sp-4)",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(15rem, 100%), 1fr))",
            marginBlockStart: "var(--sp-6)",
          }}
        >
          {gradeCounts.map(({ grade, count }) => (
            <li
              key={grade}
              data-fidelity={grade}
              style={{
                position: "relative",
                padding: "var(--sp-5)",
                border: "var(--grade-border)",
                background: "var(--grade-alpha)",
                overflow: "hidden",
              }}
            >
              <div className="grain" aria-hidden="true" />
              <FidelityBadge fidelity={grade} />
              <p style={{ marginBlockStart: "var(--sp-3)", fontSize: "var(--step--1)" }}>
                {FIDELITY_MEANING[grade]}
              </p>
              <p className="eyebrow" style={{ marginBlockStart: "var(--sp-4)" }}>
                {count} {count === 1 ? "entry" : "entries"}
              </p>
            </li>
          ))}
        </ul>

        <p style={{ marginBlockStart: "var(--sp-5)" }}>
          <Link href="/method">Read how the grading works</Link>
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Featured entry.                                                   */}
      {/* ---------------------------------------------------------------- */}
      {featured ? (
        <section
          aria-labelledby="featured-heading"
          data-fidelity={featured.fidelity}
          style={{
            borderBlock: "1px solid var(--line)",
            background: "var(--bg-raised)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="grain" aria-hidden="true" />
          <div className="shell" style={{ paddingBlock: "var(--sp-9)" }}>
            <p className="eyebrow">Start here</p>
            <h2
              id="featured-heading"
              style={{ fontSize: "var(--step-4)", marginBlockStart: "var(--sp-4)" }}
            >
              {featured.title}
            </h2>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "var(--step-1)",
                color: "var(--text-muted)",
                marginBlockStart: "var(--sp-2)",
              }}
            >
              {featured.epithet}
            </p>

            <div style={{ marginBlockStart: "var(--sp-5)", maxWidth: "60rem" }}>
              <WaveformFigure
                signature={featured.sound}
                seed={featured.slug}
                variant="waveform"
                height={160}
                label={`Waveform of the reconstruction of ${featured.title}. ${featured.sound.description}`}
              />
            </div>

            <p className="measure" style={{ marginBlockStart: "var(--sp-5)" }}>
              {featured.description}
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
              <FidelityBadge fidelity={featured.fidelity} />
              <span className="eyebrow">Last heard {featured.provenance.lastHeard}</span>
              <span className="eyebrow">{featured.provenance.place}</span>
            </div>

            <p style={{ marginBlockStart: "var(--sp-6)" }}>
              <Link href={`/entries/${featured.slug}`} className="btn">
                Open this entry
              </Link>
            </p>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------------------- */}
      {/* Categories.                                                       */}
      {/* ---------------------------------------------------------------- */}
      <section
        aria-labelledby="categories-heading"
        className="shell"
        style={{ paddingBlock: "var(--sp-9)" }}
      >
        <p className="eyebrow">Six ways to lose a sound</p>
        <h2
          id="categories-heading"
          style={{ fontSize: "var(--step-4)", marginBlockStart: "var(--sp-4)" }}
        >
          The taxonomy
        </h2>

        <ul
          style={{
            display: "grid",
            gap: "var(--sp-4)",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(18rem, 100%), 1fr))",
            marginBlockStart: "var(--sp-6)",
          }}
        >
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/categories/${category.slug}`}
                style={{
                  display: "block",
                  height: "100%",
                  padding: "var(--sp-5)",
                  border: "1px solid var(--line)",
                  borderLeft: `3px solid var(--accent-${category.accent})`,
                  textDecoration: "none",
                }}
              >
                <h3 style={{ fontSize: "var(--step-2)" }}>{category.name}</h3>
                <p
                  style={{
                    marginBlockStart: "var(--sp-2)",
                    color: "var(--text-muted)",
                    fontSize: "var(--step--1)",
                  }}
                >
                  {category.tagline}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Timeline preview.                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section
        aria-labelledby="timeline-heading"
        className="shell"
        style={{ paddingBlock: "var(--sp-8)" }}
      >
        <p className="eyebrow">When the silence fell</p>
        <h2
          id="timeline-heading"
          style={{ fontSize: "var(--step-4)", marginBlockStart: "var(--sp-4)" }}
        >
          Losses are not evenly spread
        </h2>
        <p className="measure" style={{ marginBlockStart: "var(--sp-4)", color: "var(--text-muted)" }}>
          Grouped by the year each sound was last reliably heard. The clustering after 1950 is not an
          artefact of the archive, it is the archive noticing something.
        </p>

        <ul style={{ marginBlockStart: "var(--sp-6)", display: "grid", gap: "var(--sp-3)" }}>
          {timeline.map((band) => {
            const max = Math.max(...timeline.map((b) => b.entries.length));
            const pct = Math.round((band.entries.length / max) * 100);
            return (
              <li
                key={band.band}
                style={{ display: "grid", gridTemplateColumns: "minmax(7rem, 9rem) 1fr auto", gap: "var(--sp-4)", alignItems: "center" }}
              >
                <span className="eyebrow" style={{ color: "var(--text-muted)" }}>
                  {band.band}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    display: "block",
                    height: "0.5rem",
                    background: "var(--bg-inset)",
                    border: "1px solid var(--line)",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: `${pct}%`,
                      background: "var(--signal)",
                    }}
                  />
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--step--1)" }}>
                  {band.entries.length}
                  <span className="visually-hidden">
                    {" "}
                    {band.entries.length === 1 ? "entry" : "entries"} last heard in {band.band}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        <p style={{ marginBlockStart: "var(--sp-6)" }}>
          <Link href="/timeline" className="btn">
            Walk the timeline
          </Link>
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Recent additions.                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section
        aria-labelledby="recent-heading"
        className="shell"
        style={{ paddingBlock: "var(--sp-8)" }}
      >
        <p className="eyebrow">Recently added</p>
        <h2 id="recent-heading" style={{ fontSize: "var(--step-4)", marginBlockStart: "var(--sp-4)" }}>
          The newest entries
        </h2>
        <div className="grid" style={{ marginBlockStart: "var(--sp-6)" }}>
          {recent.map((entry) => (
            <EntryCard key={entry.slug} entry={entry} />
          ))}
        </div>
        <p style={{ marginBlockStart: "var(--sp-6)" }}>
          <Link href="/atlas" className="btn">
            See all {config.totalEntries} entries
          </Link>
        </p>
      </section>
    </>
  );
}
