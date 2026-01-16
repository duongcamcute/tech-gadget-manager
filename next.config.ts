import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: any = {
  output: "standalone",
  // Move outputFileTracingIncludes to root as per warning
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/dev.db"],
    "/**/*": ["./prisma/dev.db"]
  },
  experimental: {
    // Increase body size limit for Server Actions (image uploads)
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default withPWA(nextConfig);
