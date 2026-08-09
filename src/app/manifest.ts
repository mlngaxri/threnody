import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "THRENODY: an atlas of sounds that no longer exist",
    short_name: "THRENODY",
    description:
      "An acoustic archaeology archive. Fourteen vanished sounds, each graded by how much of it is evidence and how much is inference.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    lang: "en",
    categories: ["education", "music", "reference"],
    // Icons are generated at request time by the icon route, so there is no
    // binary asset in the repository that could go missing.
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
    shortcuts: [
      { name: "The atlas", url: "/atlas" },
      { name: "The timeline", url: "/timeline" },
      { name: "Search", url: "/search" },
    ],
  };
}
