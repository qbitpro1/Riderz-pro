import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { BRAND_BY_SLUG, CATALOG_BY_BRAND, type BrandSlug } from "@/lib/catalog";

/**
 * The link back out of a standalone brand store into the shared shop. The store
 * stays the deep catalogue; this is the door to the filtered, cross-brand view
 * of the same products.
 */
export function BrandShopBar({ brand }: { brand: BrandSlug }) {
  const b = BRAND_BY_SLUG[brand];
  const count = CATALOG_BY_BRAND[brand]?.length ?? 0;

  return (
    <section className="border-b border-tint/8 bg-void">
      <div className="shell flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
        <p className="flex items-center gap-2 text-xs text-ash">
          <Icon name="filter" size={14} className="text-accent" />
          All {count} {b.name} products are in the Riderzpro shop too — filter them by type, price and
          fitment against every other brand we stock.
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-4">
          <Link href={`/shop?brand=${brand}`} className="text-xs text-accent underline underline-offset-4">
            {b.name} in the shop
          </Link>
          <Link href="/brands" className="text-xs text-ash underline underline-offset-4 hover:text-chalk">
            All brands
          </Link>
        </div>
      </div>
    </section>
  );
}
