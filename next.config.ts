import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Database drivers load native/wasm code at runtime; keep them out of the server bundle.
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
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
  // Baseline security headers on every route. No full CSP on purpose: the site
  // relies on inline scripts and a CSP would break them. HSTS belongs at the host.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self), payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\")" },
        ],
      },
    ];
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

      // The previous riderzpro.com site (a different app, replaced by this one): its page addresses
      // land on the matching page here instead of a 404.
      { source: "/login", destination: "/account/sign-in", permanent: true },
      { source: "/signup", destination: "/account/sign-in", permanent: true },
      { source: "/auth", destination: "/account/sign-in", permanent: true },
      { source: "/orders", destination: "/account/orders", permanent: true },
      { source: "/order/:id", destination: "/account/orders", permanent: true },
      { source: "/order-confirmation/:id", destination: "/account/orders", permanent: true },
      { source: "/track/:id", destination: "/account/orders", permanent: true },
      { source: "/dashboards", destination: "/account", permanent: true },
      { source: "/dashboard/customer", destination: "/account", permanent: true },
      { source: "/dashboard/vendor", destination: "/vendor/dashboard", permanent: true },
      { source: "/dashboard/rider", destination: "/rider/dashboard", permanent: true },
      { source: "/dashboard/admin", destination: "/admin", permanent: true },
      { source: "/dashboard/workshop", destination: "/garage", permanent: true },
      { source: "/assistant", destination: "/shop", permanent: true },
      { source: "/app", destination: "/", permanent: true },
      { source: "/support", destination: "/contact", permanent: true },
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/terms", destination: "/legal/terms", permanent: true },
      { source: "/vendor/login", destination: "/vendor/auth", permanent: true },
      { source: "/vendor/signup", destination: "/vendor/auth?mode=signup", permanent: true },
      { source: "/vendor/sign-up", destination: "/vendor/auth?mode=signup", permanent: true },
      // The old seller dashboard lived at /vendor/{id}; this site's own /vendor/* pages are excluded.
      { source: "/vendor/:id((?!auth$|dashboard$|onboarding$|pending$)[^/]+)", destination: "/vendor/dashboard", permanent: true },
      { source: "/admin/login", destination: "/admin", permanent: true },
      { source: "/super-admin", destination: "/admin", permanent: true },
      { source: "/super-admin/:path*", destination: "/admin", permanent: true },
      { source: "/superadmin", destination: "/admin", permanent: true },
    ];
  },
};

export default nextConfig;
