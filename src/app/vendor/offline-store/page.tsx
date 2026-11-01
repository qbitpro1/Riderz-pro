import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { vendorPage } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Offline Store login", robots: { index: false, follow: false } };

/**
 * "Offline Store login" (footer link): a signed-in seller goes straight to their shop screen;
 * anyone else signs in first and comes back here. Sellers not yet approved go to their own home.
 */
export default async function OfflineStoreLoginPage() {
  const vendor = await vendorPage(["approved"], "/vendor/offline-store");
  redirect(vendor.slug ? `/store/${vendor.slug}` : "/vendor/dashboard");
}
