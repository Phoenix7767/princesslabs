import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript checking during builds (optional)
    ignoreBuildErrors: true,
  },
  /* config options here */
};

export default nextConfig;
