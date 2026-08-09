import type { Entry } from "@/lib/types";
import { EntryCard } from "./EntryCard";

interface Props {
  related: Array<{ entry: Entry; reason: string }>;
}

/**
 * Related entries always state why they are related. A recommendation that
 * cannot explain itself is just a guess with better typography.
 */
export function RelatedEntries({ related }: Props) {
  if (related.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" style={{ marginBlockStart: "var(--sp-8)" }}>
      <h2 id="related-heading" style={{ fontSize: "var(--step-2)" }}>
        Nearby in the archive
      </h2>
      <p style={{ color: "var(--text-muted)", marginBlockStart: "var(--sp-2)" }}>
        Chosen by shared tags, category, contributors and closeness in time. Each card says which.
      </p>
      <div className="grid" style={{ marginBlockStart: "var(--sp-5)" }}>
        {related.map(({ entry, reason }) => (
          <EntryCard key={entry.slug} entry={entry} reason={reason} compact />
        ))}
      </div>
    </section>
  );
}
