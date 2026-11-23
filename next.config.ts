import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
  // Avatar and backdrop pictures go through server actions (up to 6 MB). Reel videos upload straight to Blob.
  experimental: { serverActions: { bodySizeLimit: "7mb" } },
  images: {
    // Stock photos behind link icons and on the Corkboard theme.
    remotePatterns: [new URL("https://picsum.photos/id/**")],
    minimumCacheTTL: 2678400,
  },
  
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
