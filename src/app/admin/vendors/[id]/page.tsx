import type { Metadata } from "next";
import { notFound } from "next/navigation";
import VendorReview from "@/components/admin/vendors/VendorReview";
import { vendorReview } from "@/lib/server/admin-vendors";
import { adminPage } from "@/lib/server/admin-auth";
import { holdMessages } from "@/lib/server/vendor-hold";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Seller application",
  robots: { index: false, follow: false, nocache: true },
};

export default async function VendorReviewPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage("sellers", "/admin/vendors");
  const id = (await params).id;
  const [review, hold] = await Promise.all([vendorReview(id), holdMessages(id)]);
  if (!review) notFound();
  return <VendorReview review={review} holdMessages={hold} />;
}
