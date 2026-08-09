import Link from "next/link";
import type { Category, Fidelity } from "@/lib/types";
import { FIDELITY_LABEL } from "./FidelityBadge";
import type { SortKey } from "@/lib/repository";

/**
 * Filtering is expressed entirely as links that change the URL. That makes
 * every filtered view deep-linkable, shareable, back-button correct, indexable,
 * and fully functional with JavaScript disabled. There is no client state to
 * desynchronise from the address bar.
 */

const FIDELITIES: Fidelity[] = ["field-recording", "restored", "reconstructed", "speculative"];

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "editorial", label: "Editorial order" },
  { key: "recent", label: "Recently added" },
  { key: "oldest-sound", label: "Oldest silence" },
  { key: "newest-sound", label: "Newest silence" },
  { key: "title", label: "Title, A to Z" },
];

export interface ActiveFilters {
  category?: string;
  tag?: string;
  fidelity?: string;
  sort?: string;
  featured?: string;
}

interface Props {
  basePath: string;
  active: ActiveFilters;
  categories: Category[];
  tags: Array<{ tag: string; count: number }>;
  /** Filters locked by the route itself, for example on a category page. */
  locked?: Array<keyof ActiveFilters>;
  resultCount: number;
}

function buildHref(basePath: string, active: ActiveFilters, patch: Partial<ActiveFilters>): string {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...active, ...patch })) {
    if (typeof value === "string" && value.length > 0) merged[key] = value;
  }
  const qs = new URLSearchParams(merged).toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function FilterBar({
  basePath,
  active,
  categories,
  tags,
  locked = [],
  resultCount,
}: Props) {
  const isLocked = (key: keyof ActiveFilters) => locked.includes(key);
  const hasAny =
    Boolean(active.category ?? active.tag ?? active.fidelity ?? active.featured) ||
    (active.sort !== undefined && active.sort !== "editorial");

  return (
    <section className="filters" aria-labelledby="filters-heading">
      <h2 id="filters-heading" className="visually-hidden">
        Filter and sort the archive
      </h2>

      {!isLocked("category") ? (
        <div style={{ flex: "1 1 20rem" }}>
          <p className="eyebrow" id="filter-category">
            Category
          </p>
          <ul className="chips" aria-labelledby="filter-category" style={{ marginBlockStart: "var(--sp-3)" }}>
            <li>
              <Link
                className="chip"
                data-active={!active.category ? "true" : "false"}
                aria-current={!active.category ? "true" : undefined}
                href={buildHref(basePath, active, { category: "" })}
              >
                All
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  className="chip"
                  data-active={active.category === category.slug ? "true" : "false"}
                  aria-current={active.category === category.slug ? "true" : undefined}
                  href={buildHref(basePath, active, { category: category.slug })}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!isLocked("fidelity") ? (
        <div style={{ flex: "1 1 18rem" }}>
          <p className="eyebrow" id="filter-fidelity">
            Fidelity grade
          </p>
          <ul className="chips" aria-labelledby="filter-fidelity" style={{ marginBlockStart: "var(--sp-3)" }}>
            <li>
              <Link
                className="chip"
                data-active={!active.fidelity ? "true" : "false"}
                aria-current={!active.fidelity ? "true" : undefined}
                href={buildHref(basePath, active, { fidelity: "" })}
              >
                Any
              </Link>
            </li>
            {FIDELITIES.map((fidelity) => (
              <li key={fidelity}>
                <Link
                  className="chip"
                  data-fidelity={fidelity}
                  data-active={active.fidelity === fidelity ? "true" : "false"}
                  aria-current={active.fidelity === fidelity ? "true" : undefined}
                  href={buildHref(basePath, active, { fidelity })}
                >
                  {FIDELITY_LABEL[fidelity]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ flex: "1 1 16rem" }}>
        <p className="eyebrow" id="filter-sort">
          Order
        </p>
        <ul className="chips" aria-labelledby="filter-sort" style={{ marginBlockStart: "var(--sp-3)" }}>
          {SORTS.map((sort) => {
            const isActive = (active.sort ?? "editorial") === sort.key;
            return (
              <li key={sort.key}>
                <Link
                  className="chip"
                  data-active={isActive ? "true" : "false"}
                  aria-current={isActive ? "true" : undefined}
                  href={buildHref(basePath, active, { sort: sort.key })}
                >
                  {sort.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {tags.length > 0 ? (
        <div style={{ flex: "1 1 100%" }}>
          <p className="eyebrow" id="filter-tag">
            Tag
          </p>
          <ul className="chips" aria-labelledby="filter-tag" style={{ marginBlockStart: "var(--sp-3)" }}>
            {active.tag ? (
              <li>
                <Link className="chip" href={buildHref(basePath, active, { tag: "" })}>
                  Clear tag
                </Link>
              </li>
            ) : null}
            {tags.slice(0, 18).map(({ tag, count }) => (
              <li key={tag}>
                <Link
                  className="chip"
                  data-active={active.tag === tag ? "true" : "false"}
                  aria-current={active.tag === tag ? "true" : undefined}
                  href={buildHref(basePath, active, { tag })}
                >
                  {tag}
                  <span style={{ opacity: 0.6 }}>{count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p
        aria-live="polite"
        style={{
          flex: "1 1 100%",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--step--1)",
          color: "var(--text-muted)",
        }}
      >
        {resultCount} {resultCount === 1 ? "entry" : "entries"} match this view.
        {hasAny ? (
          <>
            {" "}
            <Link href={basePath}>Reset all filters</Link>
          </>
        ) : null}
      </p>
    </section>
  );
}
