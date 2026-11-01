import type { Metadata } from "next";
import { vendorPage } from "@/lib/server/session";
import { storeSettings } from "@/lib/server/store-sales";
import { screenProducts, screenStore } from "@/lib/server/store-screen";
import { fullSalesmanFor } from "@/lib/server/assistant/store";
import { SalesmanPractice } from "@/components/vendor/salesman-ai/SalesmanPractice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Salesman AI", robots: { index: false } };

export default async function SalesmanAiPage() {
  const vendor = await vendorPage(["approved"], "/vendor/dashboard/salesman-ai");
  const [settings, products] = await Promise.all([storeSettings(vendor.id), screenProducts(vendor.id)]);
  const full = fullSalesmanFor(vendor.slug);
  return (
    <>
      <h1 className="display-3">SALESMAN AI</h1>
      <p className="mt-2 max-w-2xl text-sm text-ash">
        Your AI salesman on the Offline Store screen in your shop. It talks to the customer, finds what they need in your stock,
        compares products, bargains within your limits, adds them to the order and takes them to checkout, in English or Hinglish.
      </p>
      <SalesmanPractice
        storeName={screenStore(vendor).name}
        products={products}
        status={{
          full,
          on: settings.aiEnabled,
          bargain: settings.bargainEnabled && settings.maxDiscountPct > 0 ? { pct: settings.maxDiscountPct, rupees: settings.maxDiscountRupees } : null,
        }}
      />
    </>
  );
}
