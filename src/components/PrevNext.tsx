import Link from "next/link";
import type { Entry } from "@/lib/types";

interface Props {
  previous: Entry | null;
  next: Entry | null;
  position: number;
  total: number;
  /** Query string carried through so prev/next respects the reader's filter. */
  query?: string;
}

/**
 * Sequence navigation. The sequence is whatever ordering the reader arrived
 * with, so moving through a filtered category does not silently dump you into
 * an unrelated part of the archive.
 */
export function PrevNext({ previous, next, position, total, query = "" }: Props) {
  if (!previous && !next) return null;
  const suffix = query ? `?${query}` : "";

  return (
    <nav
      aria-label="Entry sequence"
      style={{
        marginBlockStart: "var(--sp-8)",
        paddingBlockStart: "var(--sp-5)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <p className="eyebrow" style={{ marginBlockEnd: "var(--sp-4)" }}>
        Entry {position} of {total} in this sequence
      </p>

      <div
        style={{
          display: "grid",
          gap: "var(--sp-4)",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(16rem, 100%), 1fr))",
        }}
      >
        {previous ? (
          <Link
            href={`/entries/${previous.slug}${suffix}`}
            rel="prev"
            data-fidelity={previous.fidelity}
            style={{
              display: "block",
              padding: "var(--sp-4)",
              border: "1px solid var(--line)",
              borderLeft: "3px solid var(--grade)",
              textDecoration: "none",
            }}
          >
            <span className="eyebrow">Previous</span>
            <span
              style={{
                display: "block",
                marginBlockStart: "var(--sp-2)",
                fontFamily: "var(--font-display)",
                fontSize: "var(--step-1)",
              }}
            >
              {previous.title}
            </span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}

        {next ? (
          <Link
            href={`/entries/${next.slug}${suffix}`}
            rel="next"
            data-fidelity={next.fidelity}
            style={{
              display: "block",
              padding: "var(--sp-4)",
              border: "1px solid var(--line)",
              borderRight: "3px solid var(--grade)",
              textDecoration: "none",
              textAlign: "right",
            }}
          >
            <span className="eyebrow">Next</span>
            <span
              style={{
                display: "block",
                marginBlockStart: "var(--sp-2)",
                fontFamily: "var(--font-display)",
                fontSize: "var(--step-1)",
              }}
            >
              {next.title}
            </span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
