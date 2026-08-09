import type { SoundSignature } from "@/lib/types";
import { describeSignature, spectrogramBands, waveformPath } from "@/lib/signature";

/**
 * The archive contains no image files. Every visual here is derived from the
 * entry's own synthesis recipe, which means these are not decoration and not
 * placeholders: they are a rendering of the data the reconstruction is built
 * from. Two entries can never accidentally look the same, and nothing can 404.
 *
 * Rendered server-side as deterministic SVG. No canvas, no effect, no
 * hydration mismatch, and it survives with JavaScript disabled.
 */

interface Props {
  signature: SoundSignature;
  /** Stable seed, normally the entry slug, so the drawing is entry-specific. */
  seed: string;
  variant?: "waveform" | "spectrogram";
  height?: number;
  /** Accessible description. Defaults to the signature's own description. */
  label?: string;
  /** Spectrogram grid resolution. Cards use a coarser grid than entry pages. */
  cols?: number;
  rows?: number;
}

export function WaveformFigure({
  signature,
  seed,
  variant = "waveform",
  height = 200,
  label,
  cols = 48,
  rows = 14,
}: Props) {
  const description = label ?? describeSignature(signature);
  const titleId = `fig-${seed}-${variant}-title`;

  if (variant === "spectrogram") {
    const bands = spectrogramBands(signature, seed, cols, rows);
    return (
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-labelledby={titleId}
        style={{
          width: "100%",
          height: `${height}px`,
          background: "var(--bg-inset)",
          border: "1px solid var(--line)",
        }}
      >
        <title id={titleId}>{description}</title>
        {bands.map((band) => (
          <path
            key={band.opacity}
            d={band.d}
            fill="var(--grade, var(--signal))"
            opacity={band.opacity}
          />
        ))}
      </svg>
    );
  }

  const path = waveformPath(signature, seed, 1000, height);
  const pathId = `fig-${seed}-wave`;

  return (
    <svg
      viewBox={`0 0 1000 ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-labelledby={titleId}
      style={{
        width: "100%",
        height: `${height}px`,
        background: "var(--bg-inset)",
        border: "1px solid var(--line)",
      }}
    >
      <title id={titleId}>{description}</title>
      {/* The path data is long, so it is defined once and referenced twice
          rather than serialised twice into the document. */}
      <defs>
        <path id={pathId} d={path} />
      </defs>
      <line
        x1="0"
        y1={height / 2}
        x2="1000"
        y2={height / 2}
        stroke="var(--line-strong)"
        strokeWidth="1"
      />
      <use href={`#${pathId}`} fill="var(--grade, var(--signal))" fillOpacity="0.55" />
      <use
        href={`#${pathId}`}
        fill="none"
        stroke="var(--grade, var(--signal))"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
