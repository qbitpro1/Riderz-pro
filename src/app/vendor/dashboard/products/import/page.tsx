import { vendorPage } from "@/lib/server/session";
import { CatalogueImport } from "@/components/vendor/dashboard/CatalogueImport";

export const dynamic = "force-dynamic";

export default async function ImportProductsPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/products/import");
  return <CatalogueImport readOnly={vendor.status !== "approved"} storeName={vendor.storeName} />;
}
