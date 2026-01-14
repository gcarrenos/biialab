import type { NextConfig } from "next";

// next.config.js or next.config.ts
const nextConfig = {
  images: {
    domains: ['picsum.photos', 'media.licdn.com', 'i.ytimg.com', 'yt3.ggpht.com'],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

