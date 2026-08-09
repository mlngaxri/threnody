import type { SoundSignature } from "@/lib/types";
import { describeSignature, spectrogram, waveformPath } from "@/lib/signature";

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
}

export function WaveformFigure({
  signature,
  seed,
  variant = "waveform",
  height = 200,
  label,
}: Props) {
  const description = label ?? describeSignature(signature);
  const titleId = `fig-${seed}-${variant}-title`;

  if (variant === "spectrogram") {
    const cells = spectrogram(signature, seed);
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
        {cells.map((cell, i) => (
          <rect
            key={i}
            x={cell.x}
            y={cell.y}
            width={cell.w}
            height={cell.h}
            fill="var(--grade, var(--signal))"
            opacity={cell.v}
          />
        ))}
      </svg>
    );
  }

  const path = waveformPath(signature, seed, 1000, height);

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
      <line
        x1="0"
        y1={height / 2}
        x2="1000"
        y2={height / 2}
        stroke="var(--line-strong)"
        strokeWidth="1"
      />
      <path d={path} fill="var(--grade, var(--signal))" fillOpacity="0.55" />
      <path
        d={path}
        fill="none"
        stroke="var(--grade, var(--signal))"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
