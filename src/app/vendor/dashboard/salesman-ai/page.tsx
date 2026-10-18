import type { Metadata } from "next";
import { vendorPage } from "@/lib/server/session";
import { storeSettings } from "@/lib/server/store-sales";
import { screenProducts } from "@/lib/server/store-screen";
import { assistantEnabled } from "@/lib/server/assistant/claude";
import { SalesmanPractice } from "@/components/vendor/salesman-ai/SalesmanPractice";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Salesman AI", robots: { index: false } };

export default async function SalesmanAiPage() {
  const vendor = await vendorPage(["approved"], "/vendor/dashboard/salesman-ai");
  const [settings, products] = await Promise.all([storeSettings(vendor.id), screenProducts(vendor.id)]);
  const available = assistantEnabled();
  return (
    <>
      <h1 className="display-3">SALESMAN AI</h1>
      <p className="mt-2 max-w-2xl text-sm text-ash">
        Your AI salesman on the Offline Store screen in your shop. It talks to the customer, finds what they need in your stock,
        compares products, adds them to the order, can bargain within your limits, and takes them to checkout.
      </p>
      <SalesmanPractice
        products={products}
        status={{
          available,
          on: settings.aiEnabled,
          bargain: settings.bargainEnabled && settings.maxDiscountPct > 0 ? { pct: settings.maxDiscountPct, rupees: settings.maxDiscountRupees } : null,
        }}
      />
    </>
  );
}
