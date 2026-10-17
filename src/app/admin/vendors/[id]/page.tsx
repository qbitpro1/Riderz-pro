import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VendorReview from "@/components/admin/vendors/VendorReview";
import { vendorReview } from "@/lib/server/admin-vendors";
import { adminPage } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller application",
  robots: { index: false, follow: false, nocache: true },
};

export default async function VendorReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage("sellers", "/admin/vendors");
  const review = await vendorReview((await params).id);
  if (!review) notFound();
  return <VendorReview review={review} />;
}
