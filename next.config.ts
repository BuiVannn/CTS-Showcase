import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Payload CMS and libsql need specific file handling
  serverExternalPackages: [
    "payload",
    "@payloadcms/db-sqlite",
    "@payloadcms/drizzle",
    "@libsql/hrana-client",
    "@libsql/client",
    "drizzle-kit",
    "sharp",
  ],
};

export default nextConfig;
