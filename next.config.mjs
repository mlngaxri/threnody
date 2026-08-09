/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // No remote image hosts are configured on purpose: every visual in THRENODY is
  // generated at runtime from entry data (canvas spectrograms, SVG cartography),
  // so the archive carries no third-party assets and no licensing exposure.
  images: {
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        // The API is read-mostly and safe to cache at the edge, apart from the
        // health check and the contact endpoint, which set their own headers.
        source: "/api/:path*",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
    ];
  },
};

export default nextConfig;
