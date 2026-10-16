import { vendorPage } from "@/lib/server/session";
import { listProducts } from "@/lib/server/vendor-catalogue";
import { PricingTable } from "@/components/vendor/dashboard/PricingTable";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/pricing");
  const products = (await listProducts(vendor.id, {})).filter((p) => p.status !== "archived");
  return <PricingTable initial={products} readOnly={vendor.status !== "approved"} commissionRate={vendor.commissionRate} />;
}
