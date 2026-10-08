import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  images: {
    // Automotive photography is served from Unsplash's CDN and optimised by Next
    // into AVIF/WebP at the exact sizes the layout needs.
    formats: ["image/avif", "image/webp"],
    qualities: [60, 68, 72, 75],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Authentic RECOIL product photography, served from the manufacturer's
      // own media library and its official storefront CDN.
      { protocol: "https", hostname: "recoilaudio.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
    deviceSizes: [360, 420, 640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [64, 96, 128, 200, 256, 320, 420],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
