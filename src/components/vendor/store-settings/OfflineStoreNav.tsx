import Link from "next/link";
import { Boxes, FolderTree, MonitorPlay, Plus, SlidersHorizontal } from "lucide-react";
import { offlineStoreHref } from "@/lib/vendor/types";

/**
 * The quick links at the top of every Offline Store page in the seller portal: open the
 * screen, add a product, your products, shop categories and the screen settings.
 */
export function OfflineStoreNav({ current, slug }: { current: "settings" | "categories"; slug: string | null }) {
  const tab = (on: boolean) =>
    `inline-flex min-h-10 items-center gap-2 rounded-sm border px-3 text-sm font-semibold transition-colors ${
      on ? "border-chalk bg-chalk text-void" : "border-tint/15 text-ash hover:border-tint/30 hover:text-chalk"
    }`;
  return (
    <nav aria-label="Offline Store" className="mt-5 flex max-w-2xl flex-wrap gap-2">
      <Link href="/vendor/dashboard/products/new" className="btn btn-accent btn-sm">
        <Plus size={16} aria-hidden /> Add a product
      </Link>
      <Link href="/vendor/dashboard/products" className={tab(false)}>
        <Boxes size={16} aria-hidden /> Your products
      </Link>
      <Link href="/vendor/dashboard/store-screen/categories" aria-current={current === "categories" ? "page" : undefined} className={tab(current === "categories")}>
        <FolderTree size={16} aria-hidden /> Categories
      </Link>
      <Link href="/vendor/dashboard/store-screen" aria-current={current === "settings" ? "page" : undefined} className={tab(current === "settings")}>
        <SlidersHorizontal size={16} aria-hidden /> Screen settings
      </Link>
      {slug && (
        <Link href={offlineStoreHref(slug)} className={tab(false)}>
          <MonitorPlay size={16} aria-hidden /> Open the screen
        </Link>
      )}
    </nav>
  );
}
