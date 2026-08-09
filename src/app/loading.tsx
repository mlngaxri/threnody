import { LoadingGrid } from "@/components/States";

/**
 * Root loading UI. Streamed in while a segment resolves. Kept intentionally
 * quiet: a full-bleed spinner would be louder than anything else on the site.
 */
export default function Loading() {
  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">Retrieving</p>
      <div
        className="skeleton"
        style={{ height: "3.5rem", maxWidth: "28rem", marginBlockStart: "var(--sp-4)" }}
        aria-hidden="true"
      />
      <div
        className="skeleton"
        style={{ height: "1.25rem", maxWidth: "44rem", marginBlockStart: "var(--sp-4)" }}
        aria-hidden="true"
      />
      <div style={{ marginBlockStart: "var(--sp-7)" }}>
        <LoadingGrid count={6} label="Retrieving entries from the archive" />
      </div>
    </div>
  );
}
