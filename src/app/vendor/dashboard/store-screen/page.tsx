import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
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
      <div className="flex max-w-2xl flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display-3">OFFLINE STORE</h1>
          <p className="mt-2 text-sm text-ash">Sell from the screen in your shop: Salesman AI, special prices and how customers pay.</p>
        </div>
        <Link href="/vendor/dashboard/products/new" className="btn btn-primary btn-sm shrink-0">
          <Plus size={16} aria-hidden /> Add a product
        </Link>
      </div>
      <p className="mt-3 max-w-2xl text-xs text-dim">New products show on the screen once Riderzpro approves them and they have stock.</p>
      <StoreSettingsForm initial={settings} fullAi={assistantEnabled()} onlineAvailable={onlinePaymentsEnabled()} />
    </>
  );
}
