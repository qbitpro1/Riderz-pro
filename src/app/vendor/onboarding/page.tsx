import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/vendor/onboarding/OnboardingFlow";
import { loadOnboarding } from "@/lib/server/onboarding";
import { CAN_EDIT_ONBOARDING, vendorPage } from "@/lib/server/session";

export const metadata: Metadata = {
  title: "Seller application",
  description: "Complete your Riderzpro seller application.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const vendor = await vendorPage(CAN_EDIT_ONBOARDING, "/vendor/onboarding");
  const initial = await loadOnboarding(vendor.id);
  return (
    <main className="shell max-w-5xl pb-16 pt-28 md:pb-24 md:pt-36">
      <OnboardingFlow initial={initial} />
    </main>
  );
}
