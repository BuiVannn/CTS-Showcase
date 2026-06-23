import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    viewTransition: true,
  },
  // DEV ONLY: `next dev` blocks cross-origin access to /_next/* + HMR from
  // non-localhost hosts (blockCrossSiteDEV). Whitelist tunnel hosts so the dev
  // server is testable via ngrok etc. Ignored in production builds.
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "*.ngrok.io",
  ],
};

export default nextConfig;
