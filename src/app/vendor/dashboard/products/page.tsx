import { vendorPage } from "@/lib/server/session";
import { listProducts } from "@/lib/server/vendor-catalogue";
import { ProductsList } from "@/components/vendor/dashboard/ProductsList";
import { PRODUCT_STATUSES, type VendorProductStatus } from "@/lib/vendor/types";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/products");
  const { status } = await searchParams;
  const initialStatus = PRODUCT_STATUSES.includes(status as VendorProductStatus) ? (status as VendorProductStatus) : "all";
  const products = await listProducts(vendor.id, {});
  return <ProductsList initial={products} readOnly={vendor.status !== "approved"} initialStatus={initialStatus} />;
}
