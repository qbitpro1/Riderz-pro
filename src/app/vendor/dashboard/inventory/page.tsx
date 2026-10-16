import { vendorPage } from "@/lib/server/session";
import { listProducts } from "@/lib/server/vendor-catalogue";
import { InventoryTable } from "@/components/vendor/dashboard/InventoryTable";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/inventory");
  const products = (await listProducts(vendor.id, {})).filter((p) => p.status !== "archived");
  return <InventoryTable initial={products} readOnly={vendor.status !== "approved"} />;
}
