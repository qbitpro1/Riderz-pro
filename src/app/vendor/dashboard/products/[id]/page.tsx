import { notFound } from "next/navigation";
import { vendorPage } from "@/lib/server/session";
import { getProduct } from "@/lib/server/vendor-catalogue";
import { ProductForm } from "@/components/vendor/dashboard/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; submitted?: string }>;
}) {
  const { id } = await params;
  const vendor = await vendorPage(["approved", "suspended"], `/vendor/dashboard/products/${id}`);
  const product = await getProduct(vendor.id, id);
  if (!product) notFound();
  const sp = await searchParams;
  const notice = sp.submitted ? "Submitted for review. We will notify you with the decision." : sp.created ? "Draft saved." : undefined;
  return (
    <ProductForm
      key={product.id}
      product={product}
      commissionRate={vendor.commissionRate}
      readOnly={vendor.status !== "approved"}
      notice={notice}
    />
  );
}
