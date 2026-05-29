/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gzip all responses
  compress: true,

  // Don't leak the tech stack
  poweredByHeader: false,

  // Tree-shake large icon / firebase packages by entry point
  experimental: {
    optimizePackageImports: ["lucide-react", "firebase", "recharts"],
  },

  // Security + performance HTTP headers on every route
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Stop MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Force HTTPS for 1 year (includeSubDomains)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Don't send full URL as referrer to third parties
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restrict browser APIs to what the app needs
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
          // Basic CSP — allows Firebase, Google APIs, and self
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.googleapis.com https://*.googleusercontent.com https://firebasestorage.googleapis.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.google.com wss://*.firebaseio.com",
              "frame-src https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
      // Long-lived cache for static assets (Next.js content-hashed filenames)
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },

  // Suppress the protobufjs dynamic-require warning from @google-cloud/vision
  webpack(config, { isServer }) {
    if (!isServer) {
      // These server-only packages should never be bundled for the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
