import type { Metadata } from "next";
import Link from "next/link";
import { countEntriesInCategory, getCategories } from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Six ways a sound leaves the world: extinct voices, silenced places, obsolete machines, vanished rituals, lost instruments and atmospheric ghosts.",
  alternates: { canonical: "/categories" },
  openGraph: {
    title: "Categories | THRENODY",
    description: "Six ways a sound leaves the world.",
    url: absoluteUrl("/categories"),
  },
};

export default function CategoriesPage() {
  const categories = getCategories();

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">Taxonomy</p>
      <h1 style={{ fontSize: "var(--step-5)", marginBlockStart: "var(--sp-4)" }}>
        Six ways to lose a sound
      </h1>
      <p className="measure" style={{ marginBlockStart: "var(--sp-4)", color: "var(--text-muted)" }}>
        The categories are not subject matter, they are mechanisms of loss. A sound can disappear
        because the animal died, because the place was altered, because the machine became
        unnecessary, because the practice was abandoned, because the technique was never written
        down, or because the medium itself changed. Each mechanism leaves different evidence behind,
        which is why the reconstructions differ so much in confidence.
      </p>

      <ul style={{ marginBlockStart: "var(--sp-8)", display: "grid", gap: "var(--sp-6)" }}>
        {categories.map((category) => {
          const count = countEntriesInCategory(category.id);
          return (
            <li
              key={category.id}
              style={{
                paddingInlineStart: "var(--sp-5)",
                borderInlineStart: `3px solid var(--accent-${category.accent})`,
              }}
            >
              <h2 style={{ fontSize: "var(--step-3)" }}>
                <Link href={`/categories/${category.slug}`} style={{ textDecoration: "none" }}>
                  {category.name}
                </Link>
              </h2>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  color: "var(--text-muted)",
                  marginBlockStart: "var(--sp-2)",
                }}
              >
                {category.tagline}
              </p>
              <p className="measure" style={{ marginBlockStart: "var(--sp-3)" }}>
                {category.description}
              </p>
              <p className="eyebrow" style={{ marginBlockStart: "var(--sp-3)" }}>
                {count} {count === 1 ? "entry" : "entries"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
