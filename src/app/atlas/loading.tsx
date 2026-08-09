import { LoadingGrid } from "@/components/States";

export default function AtlasLoading() {
  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">Filtering the atlas</p>
      <div
        className="skeleton"
        style={{ height: "3rem", maxWidth: "24rem", marginBlockStart: "var(--sp-4)" }}
        aria-hidden="true"
      />
      <div
        className="skeleton"
        style={{ height: "6rem", marginBlockStart: "var(--sp-6)" }}
        aria-hidden="true"
      />
      <div style={{ marginBlockStart: "var(--sp-6)" }}>
        <LoadingGrid count={6} label="Applying filters to the atlas" />
      </div>
    </div>
  );
}
