import type { Metadata } from "next";
import { WishlistView, type LiveProduct } from "@/components/wishlist/WishlistView";
import { productDetails } from "@/lib/server/catalog";
import { productHref } from "@/lib/store/types";

export const metadata: Metadata = {
  title: "Your wishlist",
  description: "Products you saved on this device.",
  alternates: { canonical: "/wishlist" },
  robots: { index: false },
};

/**
 * The wishlist lives in the visitor's browser, so the server cannot know which products it holds. It
 * passes the fields the view needs for every product (current price, whether it can be bought, name,
 * image, options) and nothing else: no dealer price, no whole record.
 */
async function liveCatalogue(): Promise<Record<string, LiveProduct>> {
  const out: Record<string, LiveProduct> = {};
  for (const d of await productDetails()) {
    out[d.slug] = {
      title: d.title,
      brandName: d.brandName,
      href: productHref(d.slug),
      price: d.price,
      mrp: d.mrp,
      buyable: d.price !== null && d.availability !== "coming-soon" && d.availability !== "out-of-stock" && d.indexable,
      hasOptions: d.options.length > 0,
      image: d.images[0],
    };
  }
  return out;
}

export default async function WishlistPage() {
  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow">Saved for later</p>
        <h1 className="display-3 mt-2">Your wishlist</h1>
        <WishlistView live={await liveCatalogue()} />
      </div>
    </section>
  );
}
