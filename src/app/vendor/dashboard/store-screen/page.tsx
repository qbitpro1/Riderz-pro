import type { Metadata } from "next";
import { vendorPage } from "@/lib/server/session";
import { storeSettings } from "@/lib/server/store-sales";
import { fullSalesmanFor } from "@/lib/server/assistant/store";
import { onlinePaymentsEnabled } from "@/lib/server/payments";
import { StoreSettingsForm } from "@/components/vendor/store-settings/StoreSettingsForm";
import { OfflineStoreNav } from "@/components/vendor/store-settings/OfflineStoreNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Offline Store settings", robots: { index: false } };

export default async function StoreScreenSettingsPage() {
  const vendor = await vendorPage(["approved"], "/vendor/dashboard/store-screen");
  const settings = await storeSettings(vendor.id);
  return (
    <>
      <h1 className="display-3">OFFLINE STORE</h1>
      <p className="mt-2 max-w-2xl text-sm text-ash">Sell from the screen in your shop: your products and categories, Salesman AI, special prices and how customers pay.</p>
      <OfflineStoreNav current="settings" slug={vendor.slug} />
      <p className="mt-3 max-w-2xl text-xs text-dim">New products show on the screen once Riderzpro approves them and they have stock.</p>
      <StoreSettingsForm initial={settings} fullAi={fullSalesmanFor(vendor.slug)} onlineAvailable={onlinePaymentsEnabled()} />
    </>
  );
}
