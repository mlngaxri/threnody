import type { Metadata } from "next";
import Link from "next/link";
import { FIDELITY_LABEL, FIDELITY_MEANING, FidelityBadge } from "@/components/FidelityBadge";
import { publishedEntries } from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";
import type { Fidelity } from "@/lib/types";

export const metadata: Metadata = {
  title: "Method",
  description:
    "How THRENODY decides what counts as evidence, what counts as inference, and how the four fidelity grades are assigned. The honest limits of acoustic reconstruction, stated plainly.",
  alternates: { canonical: "/method" },
  openGraph: {
    title: "Method | THRENODY",
    description:
      "How the archive separates evidence from inference, and why every reconstruction carries a grade.",
    url: absoluteUrl("/method"),
  },
};

const ORDER: Fidelity[] = ["field-recording", "restored", "reconstructed", "speculative"];

export default function MethodPage() {
  const counts = new Map<Fidelity, number>();
  for (const entry of publishedEntries) {
    counts.set(entry.fidelity, (counts.get(entry.fidelity) ?? 0) + 1);
  }

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">Editorial standard</p>
      <h1 style={{ fontSize: "var(--step-5)", marginBlockStart: "var(--sp-4)" }}>
        What we are allowed to claim
      </h1>

      <div className="prose" style={{ marginBlockStart: "var(--sp-7)" }}>
        <p style={{ fontSize: "var(--step-1)" }}>
          An archive of vanished sound has an obvious problem. The moment you synthesise something
          nobody alive has heard, you have made a claim about the past that cannot be checked
          against the past. THRENODY does not pretend to solve this. It labels it.
        </p>

        <p>
          Every entry carries a fidelity grade, and the grade is the first thing you see, before the
          title has finished settling. The grade is not a quality rating. A speculative entry can be
          more carefully made than a field recording. The grade answers one question only: how much
          of this is evidence and how much is inference?
        </p>

        <h2>The four grades</h2>
        <p>
          The grades form a ladder from recording to argument. The visual language changes with the
          grade: the border style, the accent colour and the density of the grain overlay all shift,
          so that after a few minutes you can tell how trustworthy an entry is before you have read
          a word of it.
        </p>
      </div>

      <ol style={{ marginBlockStart: "var(--sp-6)", display: "grid", gap: "var(--sp-6)" }}>
        {ORDER.map((fidelity, index) => (
          <li
            key={fidelity}
            data-fidelity={fidelity}
            style={{
              padding: "var(--sp-5)",
              border: "1px solid var(--line)",
              borderInlineStart: "4px solid var(--grade)",
              background: "var(--bg-raised)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "var(--sp-4)",
                alignItems: "baseline",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--step--2)",
                  color: "var(--text-faint)",
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 style={{ fontSize: "var(--step-2)" }}>{FIDELITY_LABEL[fidelity]}</h3>
              <span className="eyebrow">
                {counts.get(fidelity) ?? 0}{" "}
                {(counts.get(fidelity) ?? 0) === 1 ? "entry" : "entries"}
              </span>
            </div>
            <p className="measure" style={{ marginBlockStart: "var(--sp-3)" }}>
              {FIDELITY_MEANING[fidelity]}
            </p>
            <p style={{ marginBlockStart: "var(--sp-4)" }}>
              <Link className="chip" href={`/atlas?fidelity=${fidelity}`}>
                Show only {FIDELITY_LABEL[fidelity].toLowerCase()} entries
              </Link>
            </p>
          </li>
        ))}
      </ol>

      <div className="prose" style={{ marginBlockStart: "var(--sp-8)" }}>
        <h2>How a reconstruction is actually made</h2>
        <p>
          Where a physical object survives, the object decides. A surviving instrument, machine or
          room can be measured, and its measurements constrain the model far more tightly than any
          written account. Where the object is gone, we work from whatever is left: notation,
          patents, engineering drawings, spectrograms of related species, or the written testimony
          of people who heard it.
        </p>
        <p>
          The synthesis you hear in the browser is deliberately not the studio version. It is a
          small, honest, real-time approximation built from the same parameters that describe the
          entry: fundamental frequency, harmonic content, attack, decay, roughness and reverberation
          time. Those six numbers are published on every entry page. If you disagree with our
          reading of the evidence, you can see exactly which numbers to argue with.
        </p>

        <h2>What we refuse to do</h2>
        <ul>
          <li>
            We do not present a reconstruction without its grade, in any context, including social
            previews.
          </li>
          <li>
            We do not smooth over disagreement between sources. Where the record conflicts, the
            entry says so.
          </li>
          <li>
            We do not use a recording we cannot attribute. Every entry lists its sources and its
            contributor.
          </li>
          <li>
            We do not treat absence of evidence as licence. An entry with thin evidence is graded
            speculative and stays that way until something better appears.
          </li>
        </ul>

        <h2>Corrections</h2>
        <p>
          The archive is small on purpose. Fourteen entries deeply documented is more useful, and
          more falsifiable, than a thousand thin ones. If you can improve a source, correct a date
          or challenge a grade, that is the most valuable thing you can send us.
        </p>
      </div>

      <div
        style={{
          marginBlockStart: "var(--sp-7)",
          display: "flex",
          gap: "var(--sp-4)",
          flexWrap: "wrap",
        }}
      >
        <Link href="/contact" className="btn btn--primary">
          Submit a correction
        </Link>
        <Link href="/contributors" className="btn">
          Who made these
        </Link>
      </div>

      <div style={{ marginBlockStart: "var(--sp-8)" }}>
        <FidelityBadge fidelity="reconstructed" withMeaning />
      </div>
    </div>
  );
}
