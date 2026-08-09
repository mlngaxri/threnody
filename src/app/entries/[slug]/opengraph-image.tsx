import { ImageResponse } from "next/og";
import { getEntry, publishedEntries } from "@/lib/repository";
import { FIDELITY_LABEL } from "@/components/FidelityBadge";
import { sampleAt } from "@/lib/signature";

export const alt = "An entry in THRENODY";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return publishedEntries.map((entry) => ({ slug: entry.slug }));
}

const GRADE_COLOUR: Record<string, string> = {
  "field-recording": "#7fb069",
  restored: "#4f9fc4",
  reconstructed: "#c8b088",
  speculative: "#c4707a",
};

export default async function EntryOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = getEntry(slug);

  const title = entry?.title ?? "Not in the archive";
  const epithet = entry?.epithet ?? "This address holds no entry.";
  const grade = entry ? FIDELITY_LABEL[entry.fidelity] : "Unknown";
  const colour = entry ? (GRADE_COLOUR[entry.fidelity] ?? "#c8b088") : "#6f6c66";

  // A coarse waveform drawn as flex boxes, since next/og has no canvas. Values
  // come from the same deterministic sampler the site uses everywhere else, so
  // the social card matches the page.
  const bars: number[] = [];
  if (entry) {
    for (let i = 0; i < 64; i += 1) {
      const value = Math.abs(sampleAt(entry.sound, `${entry.slug}-og`, i / 64));
      bars.push(Math.max(0.06, Math.min(1, value)));
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0b",
          color: "#f2efe9",
          padding: "64px",
          borderLeft: `16px solid ${colour}`,
        }}
      >
        <div style={{ display: "flex", fontSize: 24, letterSpacing: 5, color: colour }}>
          {grade.toUpperCase()}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, lineHeight: 1.05, letterSpacing: -2 }}>
            {title.length > 58 ? `${title.slice(0, 55)}...` : title}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#a3a09a", marginTop: 22, lineHeight: 1.35 }}>
            {epithet.length > 130 ? `${epithet.slice(0, 127)}...` : epithet}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", height: 90, gap: 4 }}>
            {bars.map((value, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  width: 12,
                  height: Math.round(value * 88),
                  background: colour,
                  opacity: 0.75,
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 22,
              color: "#6f6c66",
              marginTop: 26,
            }}
          >
            <div style={{ display: "flex" }}>THRENODY</div>
            <div style={{ display: "flex" }}>
              {entry ? `Last heard ${entry.provenance.lastHeard}` : "No record"}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
