import { LoadingGrid } from "@/components/States";

export default function SearchLoading() {
  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">Searching</p>
      <div
        className="skeleton"
        style={{ height: "3rem", maxWidth: "30rem", marginBlockStart: "var(--sp-5)" }}
        aria-hidden="true"
      />
      <div style={{ marginBlockStart: "var(--sp-7)" }}>
        <LoadingGrid count={3} label="Searching the archive" />
      </div>
    </div>
  );
}
