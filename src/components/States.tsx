import Link from "next/link";

/**
 * Loading, empty and error states, designed rather than defaulted. All three
 * are written in the archive's own voice, because a state screen is still part
 * of the experience.
 */

export function LoadingGrid({ count = 6, label = "Loading entries" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="visually-hidden">{label}</span>
      <div className="grid" aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
    </div>
  );
}

interface EmptyProps {
  title: string;
  body: string;
  suggestions?: string[];
  /** Where a suggestion should link. Receives the raw suggestion text. */
  suggestionHref?: (value: string) => string;
}

export function EmptyState({ title, body, suggestions = [], suggestionHref }: EmptyProps) {
  return (
    <div className="state">
      <h2 className="state__title">{title}</h2>
      <p className="state__body">{body}</p>
      {suggestions.length > 0 && suggestionHref ? (
        <div>
          <p className="eyebrow" style={{ marginBlockEnd: "var(--sp-3)" }}>
            These do return results
          </p>
          <ul className="chips">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <Link className="chip" href={suggestionHref(suggestion)}>
                  {suggestion}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state state--error" role="alert">
      <h2 className="state__title">{title}</h2>
      <p className="state__body">{body}</p>
      {action}
    </div>
  );
}
