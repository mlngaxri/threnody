import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, getEntry, getTimeline, publishedEntries } from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";
import { FidelityBadge } from "@/components/FidelityBadge";
import { WaveformFigure } from "@/components/WaveformFigure";

export const metadata: Metadata = {
  title: "The extinction timeline",
  description:
    "Every sound in THRENODY placed on the year it was last reliably heard, from the eighteenth century to the present. The clustering after 1950 is the point.",
  alternates: { canonical: "/timeline" },
  openGraph: {
    title: "The extinction timeline | THRENODY",
    description: "Every sound in the archive placed on the year it was last reliably heard.",
    url: absoluteUrl("/timeline"),
  },
};

export default function TimelinePage() {
  const bands = getTimeline();
  const categories = getCategories();
  const total = publishedEntries.length;
  const busiest = bands.reduce((a, b) => (b.entries.length > a.entries.length ? b : a), bands[0]!);

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">Chronology</p>
      <h1 style={{ fontSize: "var(--step-5)", marginBlockStart: "var(--sp-4)" }}>
        The extinction timeline
      </h1>
      <p className="measure" style={{ marginBlockStart: "var(--sp-4)", color: "var(--text-muted)" }}>
        Each entry is placed on the year its sound was last reliably heard, which is rarely the year
        the thing itself ended. A machine can outlive its noise by decades in a museum, and a bird
        can be recorded years after the last breeding pair is gone. The date here is the date of
        silence, not the date of death.
      </p>

      <p
        className="measure"
        style={{
          marginBlockStart: "var(--sp-5)",
          paddingInlineStart: "var(--sp-4)",
          borderInlineStart: "2px solid var(--accent)",
        }}
      >
        {busiest.entries.length} of {total} entries fall inside {busiest.band}. The archive is small
        enough that this is an observation rather than a statistic, but the shape is consistent with
        what soundscape ecologists have been reporting for thirty years.
      </p>

      {/* The timeline itself. Built as an ordered list of sections so it reads
          correctly in a screen reader and in reading mode, with the visual
          spine drawn purely by CSS borders. */}
      <ol style={{ marginBlockStart: "var(--sp-8)", display: "grid", gap: "var(--sp-8)" }}>
        {bands.map((band) => (
          <li key={band.band}>
            <section aria-labelledby={`band-${band.from}`}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "var(--sp-4)",
                  flexWrap: "wrap",
                  paddingBlockEnd: "var(--sp-3)",
                  borderBottom: "1px solid var(--line-strong)",
                }}
              >
                <h2 id={`band-${band.from}`} style={{ fontSize: "var(--step-3)" }}>
                  {band.band}
                </h2>
                <span className="eyebrow">
                  {band.entries.length} {band.entries.length === 1 ? "sound" : "sounds"}
                </span>
              </div>

              <ol
                style={{
                  marginBlockStart: "var(--sp-5)",
                  display: "grid",
                  gap: "var(--sp-4)",
                  paddingInlineStart: "var(--sp-5)",
                  borderInlineStart: "1px solid var(--line)",
                }}
              >
                {band.entries.map((item) => {
                  const entry = getEntry(item.slug);
                  const category = categories.find((c) => c.id === item.category);
                  if (!entry) return null;
                  return (
                    <li
                      key={item.slug}
                      data-fidelity={entry.fidelity}
                      style={{ position: "relative" }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(4rem, 5rem) 1fr",
                          gap: "var(--sp-5)",
                          alignItems: "start",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "var(--step-0)",
                            color: "var(--grade)",
                          }}
                        >
                          {item.year}
                        </span>

                        <div>
                          <h3 style={{ fontSize: "var(--step-1)" }}>
                            <Link href={`/entries/${item.slug}`} style={{ textDecoration: "none" }}>
                              {entry.title}
                            </Link>
                          </h3>
                          <p
                            style={{
                              color: "var(--text-muted)",
                              fontSize: "var(--step--1)",
                              marginBlockStart: "var(--sp-2)",
                              maxWidth: "58ch",
                            }}
                          >
                            {entry.epithet}
                          </p>

                          <div style={{ maxWidth: "34rem", marginBlockStart: "var(--sp-3)" }}>
                            <WaveformFigure
                              signature={entry.sound}
                              seed={`${entry.slug}-timeline`}
                              variant="waveform"
                              height={48}
                              label={`Waveform of ${entry.title}, last heard ${item.year}. ${entry.sound.description}`}
                            />
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "var(--sp-3)",
                              flexWrap: "wrap",
                              alignItems: "center",
                              marginBlockStart: "var(--sp-3)",
                            }}
                          >
                            <FidelityBadge fidelity={entry.fidelity} />
                            {category ? (
                              <Link
                                className="chip"
                                href={`/categories/${category.slug}`}
                              >
                                {category.name}
                              </Link>
                            ) : null}
                            <span className="eyebrow">{entry.provenance.region}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </li>
        ))}
      </ol>

      <p style={{ marginBlockStart: "var(--sp-8)" }}>
        <Link href="/atlas" className="btn">
          Browse by category instead
        </Link>
      </p>
    </div>
  );
}
