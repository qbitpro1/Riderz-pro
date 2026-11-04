import type { Metadata } from "next";
import { vendorPage } from "@/lib/server/session";
import { listStoreCategories } from "@/lib/server/store-categories";
import { OfflineStoreNav } from "@/components/vendor/store-settings/OfflineStoreNav";
import { StoreCategoriesManager } from "@/components/vendor/store-settings/StoreCategoriesManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop categories", robots: { index: false } };

export default async function StoreCategoriesPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/store-screen/categories");
  const categories = await listStoreCategories(vendor.id);
  return (
    <>
      <h1 className="display-3">SHOP CATEGORIES</h1>
      <p className="mt-2 max-w-2xl text-sm text-ash">
        How customers browse your Offline Store screen. Make main categories, like Mats, and sub-categories inside them, like Autoform and GFX Pro.
        Then pick one on each product. All of them show on your shop screen; empty ones are greyed out until they have a product with stock.
      </p>
      <OfflineStoreNav current="categories" slug={vendor.status === "approved" ? vendor.slug : null} />
      <StoreCategoriesManager initial={categories} canEdit={vendor.status === "approved"} />
    </>
  );
}
