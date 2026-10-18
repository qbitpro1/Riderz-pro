import type { Metadata } from "next";
import { vendorPage } from "@/lib/server/session";
import { storeSettings } from "@/lib/server/store-sales";
import { assistantEnabled } from "@/lib/server/assistant/claude";
import { onlinePaymentsEnabled } from "@/lib/server/payments";
import { StoreSettingsForm } from "@/components/vendor/store-settings/StoreSettingsForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Offline Store settings", robots: { index: false } };

export default async function StoreScreenSettingsPage() {
  const vendor = await vendorPage(["approved"], "/vendor/dashboard/store-screen");
  const settings = await storeSettings(vendor.id);
  return (
    <>
      <h1 className="display-3">OFFLINE STORE</h1>
      <p className="mt-2 max-w-2xl text-sm text-ash">Sell from the screen in your shop: Salesman AI, special prices and how customers pay.</p>
      <StoreSettingsForm initial={settings} aiAvailable={assistantEnabled()} onlineAvailable={onlinePaymentsEnabled()} />
    </>
  );
}
