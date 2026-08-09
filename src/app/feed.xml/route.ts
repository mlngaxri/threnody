import { getCategories, getSiteConfig, publishedEntries, escapeHtml } from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 3600;

/**
 * RSS 2.0 feed of the archive. Built by hand rather than with a library,
 * because the whole document is under a hundred lines and a dependency here
 * would be pure overhead.
 */
export function GET(): Response {
  const config = getSiteConfig();
  const categories = getCategories();

  const items = [...publishedEntries]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .map((entry) => {
      const url = absoluteUrl(`/entries/${entry.slug}`);
      const category = categories.find((c) => c.id === entry.category);
      return [
        "    <item>",
        `      <title>${escapeHtml(entry.title)}</title>`,
        `      <link>${escapeHtml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeHtml(url)}</guid>`,
        `      <pubDate>${new Date(entry.publishedAt).toUTCString()}</pubDate>`,
        category ? `      <category>${escapeHtml(category.name)}</category>` : "",
        `      <description>${escapeHtml(`${entry.epithet} Fidelity grade: ${entry.fidelity}. ${entry.description}`)}</description>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeHtml(config.name)}</title>
    <link>${escapeHtml(absoluteUrl("/"))}</link>
    <atom:link href="${escapeHtml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />
    <description>${escapeHtml(config.description)}</description>
    <language>${escapeHtml(config.defaultLocale)}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
