import { buildShopifyCsv } from "@/lib/shopify/productCsv";
import { requireAdmin } from "@/lib/server/admin-auth";
import { route } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Shopify product-import CSV. Admins with catalogue access only (the /admin proxy only checks a cookie exists). */
export const GET = route(async () => {
  await requireAdmin("catalog");
  const { csv } = buildShopifyCsv();
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="riderzpro-shopify-products.csv"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
});
