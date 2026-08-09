import type { MetadataRoute } from "next";
import { absoluteUrl, isPreviewEnvironment } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Preview deployments must never be indexed, or a half-finished
  // reconstruction ends up in search results alongside the real archive.
  if (isPreviewEnvironment()) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
      sitemap: absoluteUrl("/sitemap.xml"),
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The API is documented and public, but it is not content to index.
        disallow: ["/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
