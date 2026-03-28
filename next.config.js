/** @type {import('next').NextConfig} */

const csp = [
  "default-src 'self'",
  // Next.js App Router requires unsafe-inline for hydration scripts
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Allow images from dealer sites and placeholder service
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  // API calls are same-origin only; dealer links open in new tabs (not fetch)
  "connect-src 'self'",
  "media-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig = {
  output: "standalone",
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-DNS-Prefetch-Control", value: "on" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "www.fahrrad-xxl.de" },
      { protocol: "https", hostname: "www.lucky-bike.de" },
      { protocol: "https", hostname: "www.bike-discount.de" },
    ],
  },
};

module.exports = nextConfig;
