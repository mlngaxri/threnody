export const dynamic = "force-static";

/**
 * The site icon, generated as SVG at request time. Drawn rather than shipped,
 * so the repository contains no binary asset that can go missing, and the mark
 * itself is the archive's own idea: a waveform decaying into a flat line.
 */
export function GET(): Response {
  const width = 512;
  const height = 512;
  const mid = height / 2;

  // A damped oscillation. Amplitude falls to nothing by the right edge.
  const points: string[] = [];
  const samples = 240;
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const x = 56 + t * (width - 112);
    const decay = Math.exp(-4.2 * t);
    const y = mid + Math.sin(t * Math.PI * 14) * 150 * decay;
    points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="THRENODY">
  <rect width="${width}" height="${height}" fill="#0a0a0b"/>
  <line x1="56" y1="${mid}" x2="${width - 56}" y2="${mid}" stroke="#3a3a3e" stroke-width="4"/>
  <path d="${points.join(" ")}" fill="none" stroke="#c8b088" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

  return new Response(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
