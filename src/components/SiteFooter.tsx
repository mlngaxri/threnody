import Link from "next/link";
import { getCategories, getSiteConfig } from "@/lib/repository";

export function SiteFooter() {
  const config = getSiteConfig();
  const categories = getCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__grid">
          <div>
            <p className="eyebrow">The archive</p>
            <p style={{ marginBlockStart: "var(--sp-3)", maxWidth: "34ch" }}>
              {config.totalEntries} entries covering {config.yearRange.earliest} to{" "}
              {config.yearRange.latest}. Every one carries a fidelity grade stating how much is
              evidence and how much is inference.
            </p>
          </div>

          <nav aria-label="Categories">
            <p className="eyebrow">Categories</p>
            <ul style={{ marginBlockStart: "var(--sp-3)", display: "grid", gap: "var(--sp-2)" }}>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Archive">
            <p className="eyebrow">Archive</p>
            <ul style={{ marginBlockStart: "var(--sp-3)", display: "grid", gap: "var(--sp-2)" }}>
              <li>
                <Link href="/atlas">Full atlas</Link>
              </li>
              <li>
                <Link href="/timeline">Extinction timeline</Link>
              </li>
              <li>
                <Link href="/method">Method and grading</Link>
              </li>
              <li>
                <Link href="/contributors">Contributors</Link>
              </li>
              <li>
                <Link href="/feed.xml">Feed</Link>
              </li>
              <li>
                <Link href="/api-docs">API documentation</Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className="eyebrow">Correspondence</p>
            <p style={{ marginBlockStart: "var(--sp-3)", maxWidth: "32ch" }}>
              If you hold a recording, a notation or a first-hand account of something in this
              archive, or of something that should be, we want to hear from you.
            </p>
            <p style={{ marginBlockStart: "var(--sp-3)" }}>
              <Link href="/contact">Submit a sound</Link>
            </p>
          </div>
        </div>

        <hr className="rule" style={{ marginBlock: "var(--sp-6) var(--sp-4)" }} />

        <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--step--2)", color: "var(--text-faint)" }}>
          THRENODY {year}. An independent acoustic archaeology archive. Reconstructions are released
          for study and citation. Source material remains with its holders.
        </p>
      </div>
    </footer>
  );
}
