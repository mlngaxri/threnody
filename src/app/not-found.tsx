import type { Metadata } from "next";
import Link from "next/link";
import { getSuggestions, publishedEntries } from "@/lib/repository";
import { WaveformFigure } from "@/components/WaveformFigure";

export const metadata: Metadata = {
  title: "No signal",
  description: "This address holds nothing. A short note on silence, and the way back to the atlas.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  // The 404 is the one page in the archive where the subject and the situation
  // are the same thing: something that was expected to be here is not.
  const witness = publishedEntries[0];

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-9)" }}>
      <p className="eyebrow">Error 404</p>
      <h1
        style={{
          fontSize: "var(--step-6)",
          marginBlockStart: "var(--sp-4)",
          letterSpacing: "-0.03em",
        }}
      >
        No signal at this address
      </h1>

      <p
        className="measure"
        style={{
          marginBlockStart: "var(--sp-5)",
          fontSize: "var(--step-1)",
          color: "var(--text-muted)",
        }}
      >
        Which is, in fairness, the subject of this entire archive. Something was expected here and
        is not here. The difference is that this absence is recoverable: the page below is a real
        one, and the atlas holds {publishedEntries.length} entries that do exist.
      </p>

      {witness ? (
        <div
          style={{
            marginBlockStart: "var(--sp-7)",
            maxWidth: "44rem",
            opacity: 0.35,
          }}
          aria-hidden="true"
        >
          <WaveformFigure
            signature={witness.sound}
            seed="not-found-flatline"
            variant="waveform"
            height={90}
            label="Decorative flat trace"
          />
        </div>
      ) : null}

      <nav aria-label="Recovery" style={{ marginBlockStart: "var(--sp-7)" }}>
        <p className="eyebrow">Try instead</p>
        <div
          style={{
            marginBlockStart: "var(--sp-4)",
            display: "flex",
            gap: "var(--sp-4)",
            flexWrap: "wrap",
          }}
        >
          <Link href="/" className="btn btn--primary">
            The landing
          </Link>
          <Link href="/atlas" className="btn">
            The atlas
          </Link>
          <Link href="/timeline" className="btn">
            The timeline
          </Link>
          <Link href="/search" className="btn">
            Search
          </Link>
        </div>

        <p className="eyebrow" style={{ marginBlockStart: "var(--sp-6)" }}>
          Or one of these, which definitely return something
        </p>
        <ul className="chips" style={{ marginBlockStart: "var(--sp-3)" }}>
          {getSuggestions(6).map((suggestion) => (
            <li key={suggestion}>
              <Link className="chip" href={`/search?q=${encodeURIComponent(suggestion)}`}>
                {suggestion}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
