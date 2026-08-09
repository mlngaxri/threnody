export default function EntryLoading() {
  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }} role="status" aria-live="polite">
      <span className="visually-hidden">Loading this entry</span>
      <div aria-hidden="true" style={{ display: "grid", gap: "var(--sp-5)" }}>
        <div className="skeleton" style={{ height: "1rem", maxWidth: "14rem" }} />
        <div className="skeleton" style={{ height: "4rem", maxWidth: "34rem" }} />
        <div className="skeleton" style={{ height: "9rem" }} />
        <div className="skeleton" style={{ height: "1rem", maxWidth: "48rem" }} />
        <div className="skeleton" style={{ height: "1rem", maxWidth: "46rem" }} />
        <div className="skeleton" style={{ height: "1rem", maxWidth: "40rem" }} />
      </div>
    </div>
  );
}
