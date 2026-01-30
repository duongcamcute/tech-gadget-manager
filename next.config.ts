/* eslint-disable @typescript-eslint/no-require-imports */
const withPWA = require("next-pwa")({

  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // Disable PWA in development to avoid "GenerateSW called multiple times" warning
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.dicebear\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "avatar-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
  ],
});

/* eslint-disable @typescript-eslint/no-explicit-any */
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
