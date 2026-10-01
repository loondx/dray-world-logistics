import type { NextConfig } from "next";

// HSTS is set by Nginx (self-hosted) or by Vercel; these apply to every response.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (Vercel builds its own output).
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
  experimental: {
    // Company logo upload (max 2 MB) goes through a server action. Load documents
    // use the /api/loads/[id]/documents route handler with its own size limit.
    serverActions: { bodySizeLimit: "3mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
