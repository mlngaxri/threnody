import type { Fidelity } from "@/lib/types";

/**
 * The fidelity grade is the spine of this archive. It states how much of what
 * you are about to hear is evidence and how much is inference. It is always
 * rendered as text as well as colour, because colour alone is not a signal
 * everyone can receive.
 */

export const FIDELITY_LABEL: Record<Fidelity, string> = {
  "field-recording": "Field recording",
  restored: "Restored",
  reconstructed: "Reconstructed",
  speculative: "Speculative",
};

export const FIDELITY_MEANING: Record<Fidelity, string> = {
  "field-recording":
    "An authentic recording of the sound survives. What you hear is the thing itself, cleaned but not invented.",
  restored:
    "A damaged original survives and has been repaired. The material is real; the repairs are documented and reversible.",
  reconstructed:
    "No usable recording survives. The sound is rebuilt by physical modelling from notation, measurement or the surviving object.",
  speculative:
    "No primary audio exists and none is likely to. This is an informed synthesis from written description, and it is an argument rather than a record.",
};

interface Props {
  fidelity: Fidelity;
  /** Renders the one-line meaning beneath the badge. */
  withMeaning?: boolean;
}

export function FidelityBadge({ fidelity, withMeaning = false }: Props) {
  return (
    <span data-fidelity={fidelity}>
      <span className="grade-badge">
        <span className="grade-badge__dot" aria-hidden="true" />
        <span className="visually-hidden">Fidelity grade: </span>
        {FIDELITY_LABEL[fidelity]}
      </span>
      {withMeaning ? (
        <span
          style={{
            display: "block",
            marginBlockStart: "var(--sp-3)",
            color: "var(--text-muted)",
            fontSize: "var(--step--1)",
            maxWidth: "48ch",
          }}
        >
          {FIDELITY_MEANING[fidelity]}
        </span>
      ) : null}
    </span>
  );
}
