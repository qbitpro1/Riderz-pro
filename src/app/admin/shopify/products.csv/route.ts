import { buildShopifyCsv } from "@/lib/shopify/productCsv";

export const dynamic = "force-dynamic";

/** Shopify product-import CSV. Protected by the /admin proxy. */
export function GET() {
  const { csv } = buildShopifyCsv();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="riderzpro-shopify-products.csv"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
