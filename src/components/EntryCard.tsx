import Link from "next/link";
import type { Entry } from "@/lib/types";
import { FidelityBadge } from "./FidelityBadge";
import { WaveformFigure } from "./WaveformFigure";

interface Props {
  entry: Entry;
  /** Shown as a small explanatory line, for example why this was recommended. */
  reason?: string;
  /** Suppresses the spectrogram in dense lists. */
  compact?: boolean;
}

export function EntryCard({ entry, reason, compact = false }: Props) {
  return (
    <article className="card" data-fidelity={entry.fidelity}>
      <div className="grain" aria-hidden="true" />

      {!compact ? (
        <WaveformFigure
          signature={entry.sound}
          seed={entry.slug}
          variant="spectrogram"
          height={84}
          label={`Spectrogram of the reconstruction of ${entry.title}. ${entry.sound.description}`}
        />
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--sp-3)" }}>
        <FidelityBadge fidelity={entry.fidelity} />
        {entry.featured ? (
          <span className="eyebrow" style={{ color: "var(--accent)" }}>
            Featured
          </span>
        ) : null}
      </div>

      <h3 className="card__title">
        <Link href={`/entries/${entry.slug}`} className="card__link" style={{ textDecoration: "none" }}>
          {entry.title}
        </Link>
      </h3>

      <p className="card__epithet">{entry.epithet}</p>
      <p className="card__desc">{entry.description}</p>

      {reason ? (
        <p className="eyebrow" style={{ color: "var(--text-muted)" }}>
          {reason}
        </p>
      ) : null}

      <div className="card__meta">
        <span>
          <span className="visually-hidden">Last reliably heard in </span>
          {entry.provenance.lastHeard}
        </span>
        <span aria-hidden="true">/</span>
        <span>{entry.provenance.region}</span>
        <span aria-hidden="true">/</span>
        <span>{entry.readingMinutes} min read</span>
      </div>
    </article>
  );
}
