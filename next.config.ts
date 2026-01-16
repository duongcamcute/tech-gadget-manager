import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  experimental: {
    // Explicitly include the database file in the serverless function bundle
    outputFileTracingIncludes: {
      "/api/**/*": ["./prisma/dev.db"],
      "/**/*": ["./prisma/dev.db"]
    }
  },
};

export default withPWA(nextConfig);
