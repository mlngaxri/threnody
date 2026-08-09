import type { Entry, EntryBlock } from "@/lib/types";
import { WaveformFigure } from "./WaveformFigure";

/**
 * Renders the authored body of an entry. The block union is deliberately small
 * and closed, so this switch is exhaustive and a new block kind becomes a type
 * error rather than a silently dropped paragraph.
 */

interface Props {
  blocks: EntryBlock[];
  entry: Entry;
}

export function BlockRenderer({ blocks, entry }: Props) {
  return (
    <div className="prose">
      {blocks.map((block, index) => (
        <Block key={index} block={block} entry={entry} index={index} />
      ))}
    </div>
  );
}

function Block({ block, entry, index }: { block: EntryBlock; entry: Entry; index: number }) {
  switch (block.kind) {
    case "paragraph":
      return <p>{block.text}</p>;

    case "heading":
      return <h2>{block.text}</h2>;

    case "quote":
      return (
        <figure>
          <blockquote>{block.text}</blockquote>
          <figcaption>{block.attribution}</figcaption>
        </figure>
      );

    case "listen":
      // A cue in the text that points at the reconstruction. The audible
      // control lives in the player; this is the written equivalent, so the
      // narrative still makes sense with sound off, unavailable or unwanted.
      return (
        <aside className="note" aria-label="Listening cue">
          <span className="note__label">Listen for</span>
          <p>{block.caption}</p>
        </aside>
      );

    case "figure":
      return (
        <figure>
          <WaveformFigure
            signature={entry.sound}
            seed={`${entry.slug}-${index}`}
            variant={index % 2 === 0 ? "waveform" : "spectrogram"}
            height={180}
            label={block.alt}
          />
          <figcaption>{block.caption}</figcaption>
        </figure>
      );

    case "note":
      return (
        <aside className="note" aria-label="Editorial note">
          <span className="note__label">Editorial note</span>
          <p>{block.text}</p>
        </aside>
      );

    default: {
      // Exhaustiveness check. If a block kind is added to the union and not
      // handled above, this line stops compiling.
      const exhaustive: never = block;
      return exhaustive;
    }
  }
}
