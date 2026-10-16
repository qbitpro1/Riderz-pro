import { vendorPage } from "@/lib/server/session";
import { ProductForm } from "@/components/vendor/dashboard/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/products/new");
  return <ProductForm product={null} commissionRate={vendor.commissionRate} readOnly={vendor.status !== "approved"} />;
}
