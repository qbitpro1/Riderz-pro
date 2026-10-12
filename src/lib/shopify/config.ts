import "server-only";

/**
 * Shopify configuration, read from the environment. Server-only: the
 * Storefront token must never reach the browser.
 *
 * The default API version is a placeholder that was current when this was
 * written; set SHOPIFY_API_VERSION to the current stable version when the
 * store is created (see docs/SHOPIFY_SETUP.md).
 */

// PLACEHOLDER, not necessarily current: set SHOPIFY_API_VERSION when the store is created.
export const DEFAULT_SHOPIFY_API_VERSION = "2025-07";

export type ShopifyConfig = {
  domain: string;
  token: string;
  apiVersion: string;
};

function clean(v: string | undefined): string {
  return (v ?? "").trim();
}

/** Accepts `riderzpro.myshopify.com` and tolerates a pasted scheme or trailing slash. */
function normaliseDomain(raw: string): string {
  return raw.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase();
}

export function getShopifyConfig(): ShopifyConfig | null {
  const domain = normaliseDomain(clean(process.env.SHOPIFY_STORE_DOMAIN));
  const token = clean(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN);
  if (!domain || !token) return null;
  // Guard against a malformed domain being used to build a request URL.
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(domain)) return null;
  const apiVersion = clean(process.env.SHOPIFY_API_VERSION) || DEFAULT_SHOPIFY_API_VERSION;
  if (!/^\d{4}-\d{2}$|^unstable$/.test(apiVersion)) return null;
  return { domain, token, apiVersion };
}

export function isShopifyConfigured(): boolean {
  return getShopifyConfig() !== null;
}

/** True when the owner has switched the visible "Checkout securely" button on. */
export function isShopifyCheckoutFlagOn(): boolean {
  return process.env.NEXT_PUBLIC_SHOPIFY_CHECKOUT === "1";
}
