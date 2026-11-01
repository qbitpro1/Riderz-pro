import { sql } from "@/lib/db/client";
import { BRANDS } from "@/lib/catalog/brands";
import { ok, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/**
 * GET → { brands: string[] }: suggestions for the product form's Brand field. The brands this
 * seller already lists come first (in their own spelling), then the Riderzpro catalogue's brands.
 */
export const GET = route(async () => {
  const vendor = await requireVendor(["approved", "suspended"]);
  const own = await sql<{ brand: string }>(
    "SELECT brand FROM vendor_products WHERE vendor_id = $1 AND brand <> '' GROUP BY brand ORDER BY count(*) DESC, brand LIMIT 200",
    [vendor.id],
  );
  const seen = new Set<string>();
  const brands: string[] = [];
  for (const name of [...own.map((r) => r.brand.trim()), ...BRANDS.map((b) => b.name)]) {
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    brands.push(name);
  }
  return ok({ brands });
});
