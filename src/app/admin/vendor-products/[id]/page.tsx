import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductReview from "@/components/admin/vendor-products/ProductReview";
import { productReview } from "@/lib/server/admin-vendors";
import { adminPage } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Review seller product",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProductReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage("sellers", "/admin/vendor-products");
  const review = await productReview((await params).id);
  if (!review) notFound();
  return <ProductReview review={review} />;
}
