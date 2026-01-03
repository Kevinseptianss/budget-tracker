import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force webpack instead of Turbopack to avoid issues
  experimental: {
    webpackBuildWorker: true,
  },
  // Disable static generation to prevent serialization issues
  output: "standalone",
  trailingSlash: true,
  // Disable static optimization
  generateBuildId: async () => {
    return "build-" + Date.now();
  },
};

export default nextConfig;
