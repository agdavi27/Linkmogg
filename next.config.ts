import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: false,
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
