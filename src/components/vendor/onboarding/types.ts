import type { VendorSelf } from "@/lib/vendor/types";

/** What GET /api/vendor/onboarding returns (and the page passes to the stepper). */
export type OnboardingState = {
  vendor: VendorSelf;
  otp: { email: boolean; mobile: boolean };
  uploaded: { id: string; kind: string; mime: string; size: number }[];
  bank: { holderName: string; accountLast4: string; ifsc: string } | null;
};
