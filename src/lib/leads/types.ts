/** The site's request forms that also open WhatsApp. Client-safe. */
export const LEAD_KINDS = {
  garage_booking: "Garage booking",
  car_inspection: "Used-car inspection",
  partner: "Partner / supplier sign-up",
  be6_waitlist: "BE 6 waitlist",
  sell_car: "Sell my car",
  quote_ppf: "PPF quote",
  quote_build: "Build quote",
  quote_audio: "Audio quote",
  quote_autoform: "Autoform seat covers",
  quote_be6: "BE 6 build",
} as const;
export type LeadKind = keyof typeof LEAD_KINDS;
