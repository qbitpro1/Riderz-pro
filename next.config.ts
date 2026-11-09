import type { NextConfig } from "next";
import path from "node:path";

/**
 * Content Security Policy. No nonces, so it works with statically rendered pages; the price is
 * script-src 'unsafe-inline' (Next's inline bootstrap/RSC scripts, the theme script in
 * src/components/theme/InlineScript.tsx, JSON-LD). Even so it limits where scripts, frames, form
 * posts and connections can go, and frame-ancestors / base-uri / object-src close clickjacking,
 * <base> hijacking and plugin content.
 *
 * CSP_MODE (read at BUILD time, like NEXT_PUBLIC_*): "report-only" (default) sends
 * Content-Security-Policy-Report-Only, so a missed source only logs in the browser console;
 * "enforce" sends Content-Security-Policy; "off" sends neither. See docs/DEPLOY.md §11.
 */
const CSP_MODE = (process.env.CSP_MODE || "report-only").trim().toLowerCase();
const isDev = process.env.NODE_ENV === "development";

/** Origin of the map tile template (NEXT_PUBLIC_MAP_TILES_URL), with "{s}" subdomains as a wildcard. */
function tileSource(): string {
  const tpl = process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const m = /^(https?):\/\/([^/?#]+)/i.exec(tpl);
  if (!m) return "https://tile.openstreetmap.org";
  const host = m[2].replace(/\{s\}/g, "*");
  return `${m[1].toLowerCase()}://${host.toLowerCase()}`;
}

const RAZORPAY = "https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com";

const CSP_DIRECTIVES: Record<string, string> = {
  "default-src": "'self'",
  // Razorpay checkout.js is injected on demand (src/lib/payments/checkout.ts). Dev needs eval for React's
  // debugging and the HMR client.
  "script-src": `'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${RAZORPAY}`,
  // Tailwind/next-font CSS is same-origin; inline <style> (store screen) and style="" (Leaflet markers).
  "style-src": "'self' 'unsafe-inline'",
  // next/image serves remotePatterns hosts through /_next/image; the hosts are listed for any direct
  // <img>. Leaflet tiles are plain <img>. data:/blob: for inline SVG icons and local previews.
  "img-src": `'self' data: blob: https://images.unsplash.com https://recoilaudio.com https://cdn.shopify.com ${tileSource()} https://*.razorpay.com`,
  // next/font self-hosts the Google fonts.
  "font-src": "'self' data:",
  // Razorpay's API and its checkout telemetry (lumberjack.razorpay.com). Every other call goes through /api.
  "connect-src": `'self' ${RAZORPAY}`,
  // Razorpay Checkout opens in an iframe; /locations embeds Google Maps (maps.google.com redirects to
  // www.google.com/maps/embed); admin review previews uploaded PDFs from /api/admin/files.
  "frame-src": `'self' ${RAZORPAY} https://maps.google.com https://www.google.com`,
  "media-src": "'self' blob:",
  "worker-src": "'self' blob:",
  "manifest-src": "'self'",
  "object-src": "'none'",
  "base-uri": "'self'",
  // Razorpay's redirect / 3-D Secure flows post from the page to api.razorpay.com.
  "form-action": `'self' ${RAZORPAY}`,
  "frame-ancestors": "'self'",
};

const CSP_VALUE = Object.entries(CSP_DIRECTIVES)
  .map(([k, v]) => `${k} ${v}`)
  // No upgrade-insecure-requests: shop screens load the site over plain http on the shop's local
  // network, and HSTS already keeps riderzpro.com on https.
  .join("; ");

const cspHeader =
  CSP_MODE === "off" ? [] : [{ key: CSP_MODE === "enforce" ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only", value: CSP_VALUE }];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
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
  // Baseline security headers on every route, plus the CSP above (report-only by default; it allows
  // the inline scripts the site relies on). HSTS in production only (local dev is
  // plain http); without includeSubDomains, so a subdomain still on http (the old site during the
  // switch) keeps working.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self), payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\")" },
          ...cspHeader,
          ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }] : []),
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
      { source: "/app", destination: "/", permanent: true },
      { source: "/support", destination: "/contact", permanent: true },
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/terms", destination: "/legal/terms", permanent: true },
      { source: "/vendor/login", destination: "/vendor/auth", permanent: true },
      { source: "/vendor/signup", destination: "/vendor/auth?mode=signup", permanent: true },
      { source: "/vendor/sign-up", destination: "/vendor/auth?mode=signup", permanent: true },
      // The old seller dashboard lived at /vendor/{id}; this site's own /vendor/* pages are excluded.
      { source: "/vendor/:id((?!auth$|dashboard$|onboarding$|pending$|offline-store$)[^/]+)", destination: "/vendor/dashboard", permanent: true },
      { source: "/admin/login", destination: "/admin", permanent: true },
      { source: "/super-admin", destination: "/admin", permanent: true },
      { source: "/super-admin/:path*", destination: "/admin", permanent: true },
      { source: "/superadmin", destination: "/admin", permanent: true },
    ];
  },
};

export default nextConfig;
