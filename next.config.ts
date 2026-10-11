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
  // Pre-rebrand URLs (Motorbotz → Riderzpro), kept alive for bookmarks and search engines.
  redirects() {
    return [
      { source: "/shop/protection", destination: "/shop/covers-guards", permanent: true },
      { source: "/why-motorbotz", destination: "/why-riderzpro", permanent: true },
      { source: "/brands/motorbotz", destination: "/brands/riderzpro", permanent: true },
      { source: "/product/motorbotz-9d-floor-mats", destination: "/products/riderzpro-9d-floor-mats", permanent: true },
      {
        source: "/product/motorbotz-signature-component-set",
        destination: "/products/riderzpro-signature-component-set",
        permanent: true,
      },
      // One product page for every brand, at /products/{slug}. The explicit
      // rules above come first so the Motorbotz URLs resolve in a single hop.
      { source: "/product/:slug", destination: "/products/:slug", permanent: true },
      { source: "/autoform/:design", destination: "/products/autoform-:design", permanent: true },
      // The compare feature was dropped; its URL goes to the shop.
      { source: "/compare", destination: "/shop", permanent: true },
      // Pre-taxonomy shop categories, folded into the eight departments.
      { source: "/shop/audio", destination: "/shop/multimedia", permanent: true },
      { source: "/shop/off-road", destination: "/shop/off-roading", permanent: true },
      { source: "/shop/performance", destination: "/shop/accessories?group=performance", permanent: true },
    ];
  },
};

export default nextConfig;
