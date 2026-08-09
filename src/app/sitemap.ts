import type { MetadataRoute } from "next";
import { getCategories, publishedEntries } from "@/lib/repository";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/atlas"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/timeline"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/categories"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absoluteUrl("/method"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contributors"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/search"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/api-docs"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = getCategories().map((category) => ({
    url: absoluteUrl(`/categories/${category.slug}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Drafts are excluded, matching what the repository will actually serve.
  const entryRoutes: MetadataRoute.Sitemap = publishedEntries.map((entry) => ({
    url: absoluteUrl(`/entries/${entry.slug}`),
    lastModified: new Date(entry.updatedAt),
    changeFrequency: "monthly",
    priority: entry.featured ? 0.9 : 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...entryRoutes];
}
