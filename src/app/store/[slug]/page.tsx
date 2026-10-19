import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentSession } from "@/lib/server/session";
import { screenFitment, screenProducts, screenStore } from "@/lib/server/store-screen";
import { vendorHome } from "@/lib/vendor/types";
import { StoreScreen } from "@/components/vendor/store-screen/StoreScreen";
import { payOptions, storeSettings } from "@/lib/server/store-sales";

// Per request: products, stock and approvals change without a deploy.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store screen",
  robots: { index: false, follow: false },
};

/**
 * A seller's offline store screen: the order screen customers use in the seller's own
 * shop. Only the signed-in owner of an approved store can open it; opening it locks
 * this session to the screen until the seller unlocks it with their password.
 */
export default async function StoreScreenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await currentSession();
  if (!session) redirect(`/vendor/auth?next=${encodeURIComponent(`/store/${slug}`)}`);
  const { vendor } = session;
  if (vendor.status !== "approved" || !vendor.slug) redirect(vendorHome(vendor.status));
  if (vendor.slug !== slug) redirect(`/store/${vendor.slug}`);

  const [products, settings] = await Promise.all([screenProducts(vendor.id), storeSettings(vendor.id)]);
  return (
    <StoreScreen
      store={screenStore(vendor)}
      products={products}
      fitment={screenFitment(products)}
      locked={session.locked}
      sales={{ aiEnabled: settings.aiEnabled, pay: payOptions(settings) }}
    />
  );
}
