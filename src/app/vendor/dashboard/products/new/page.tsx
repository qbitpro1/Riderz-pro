import { vendorPage } from "@/lib/server/session";
import { ProductForm } from "@/components/vendor/dashboard/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ shopCategory?: string }> }) {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/products/new");
  // "Add product" from a shop category arrives with that category already picked (checked again on save).
  const { shopCategory } = await searchParams;
  return (
    <ProductForm
      product={null}
      commissionRate={vendor.commissionRate}
      readOnly={vendor.status !== "approved"}
      initialShopCategory={typeof shopCategory === "string" && shopCategory.length <= 80 ? shopCategory : null}
    />
  );
}
