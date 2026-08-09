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
          {
            // The archive loads nothing from anywhere else. 'unsafe-inline' is
            // required for Next's inline bootstrap script and for the inline
            // style attributes used throughout the layout; every other source is
            // locked to self, so an injected tag has nowhere to send data.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
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
