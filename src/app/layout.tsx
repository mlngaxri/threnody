import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeScript, ThemeToggle } from "@/components/ThemeToggle";
import { getSiteConfig } from "@/lib/repository";
import { absoluteUrl, getSiteUrl } from "@/lib/site";

const config = getSiteConfig();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${config.name}, ${config.tagline}`,
    template: `%s | ${config.name}`,
  },
  description: config.description,
  applicationName: config.name,
  keywords: [
    "acoustic archaeology",
    "extinct sounds",
    "sound archive",
    "bioacoustics",
    "soundscape",
    "audio reconstruction",
    "extinct species calls",
    "industrial sound history",
  ],
  authors: [{ name: "THRENODY" }],
  creator: "THRENODY",
  publisher: "THRENODY",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: `${config.name} archive feed` }],
    },
  },
  openGraph: {
    type: "website",
    siteName: config.name,
    title: `${config.name}, ${config.tagline}`,
    description: config.description,
    url: absoluteUrl("/"),
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${config.name}, ${config.tagline}`,
    description: config.description,
    creator: config.socialHandle,
    site: config.socialHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#07080a" },
    { media: "(prefers-color-scheme: light)", color: "#f4f1ea" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const organisation = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.name,
    alternateName: config.tagline,
    url: getSiteUrl(),
    description: config.description,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: config.name,
      description: "An independent acoustic archaeology archive.",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script
          type="application/ld+json"
          // Serialised from a literal we control. No user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation) }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteNav />
        <ThemeToggle />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
