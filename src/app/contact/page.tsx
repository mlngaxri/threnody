import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { publishedEntries } from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact the archive",
  description:
    "Submit a correction, offer a recording or a source, or ask about reuse. Corrections go to the contributor responsible for the entry, not to a general inbox.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact the archive | THRENODY",
    description: "Submit a correction, offer a source, or ask about reuse.",
    url: absoluteUrl("/contact"),
  },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ContactPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = params.entry;
  const requested = Array.isArray(raw) ? raw[0] : raw;

  const entries = publishedEntries.map((entry) => ({ slug: entry.slug, title: entry.title }));
  const defaultSlug = entries.some((entry) => entry.slug === requested) ? requested : "";

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-8)" }}>
      <p className="eyebrow">Correspondence</p>
      <h1 style={{ fontSize: "var(--step-5)", marginBlockStart: "var(--sp-4)" }}>
        Tell us what we got wrong
      </h1>
      <p className="measure" style={{ marginBlockStart: "var(--sp-4)", color: "var(--text-muted)" }}>
        An archive built on inference improves only when people who know more than we do say so. A
        corrected date, a better source or a challenge to a fidelity grade is worth more to this
        project than praise.
      </p>

      <div
        style={{
          marginBlockStart: "var(--sp-6)",
          padding: "var(--sp-5)",
          border: "1px solid var(--line)",
          background: "var(--bg-raised)",
          maxWidth: "38rem",
        }}
      >
        <p className="eyebrow">Before you write</p>
        <ul
          className="measure"
          style={{ marginBlockStart: "var(--sp-3)", display: "grid", gap: "var(--sp-2)" }}
        >
          <li>
            Read the <Link href="/method">method</Link> first if you are disputing a grade. The
            grades mean something specific.
          </li>
          <li>Submissions are rate limited to five in ten minutes from the same address.</li>
          <li>Nothing you send is published without asking you first.</li>
        </ul>
      </div>

      <div style={{ marginBlockStart: "var(--sp-7)" }}>
        <ContactForm entrySlugs={entries} defaultSlug={defaultSlug} />
      </div>
    </div>
  );
}
