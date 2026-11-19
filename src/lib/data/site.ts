export const SITE = {
  name: "Riderzpro",
  tagline: "CAR & BIKE ACCESSORIES",
  support: "Your Car. Your Build. Your Ride.",
  description:
    "Riderzpro makes and sells car accessories in India — interior, exterior, multimedia, covers and guards, utilities, lighting and off-roading parts, fitment-checked for your car, with installation available.",
  url: "https://riderzpro.com",
  phone: "+91 98118 86661",
  phoneHref: "tel:+919811886661",
  email: "admin@riderzpro.com",
  // No social media accounts yet: add their links here (and in the footer) when they exist.
  hours: "Mon – Sat · 9:30 AM – 8:00 PM · Sunday by appointment",
  /**
   * The name the website, emails and invoices use for the business. The registered company name is
   * to be confirmed by the owner (with the GSTIN below and the registered office); until then, Riderzpro.
   */
  legalName: "Riderzpro",
  gstin: "29AAJCM4412Q1ZP",
  /**
   * Registered office address printed on GST invoices. Empty until the company confirms it
   * (docs/team/Sathwik_work.md §5); the invoice leaves the line out while it is empty.
   */
  registeredOffice: "",
} as const;

export type Location = {
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  mapUrl: string;
  embedQuery: string;
  services: string[];
  bays: number;
  flagship?: boolean;
};

/**
 * Walk-in garages. Empty: the earlier Bengaluru, Hyderabad and Pune entries were demo content. Pages
 * that list garages hide that section while this is empty. Add a real garage here to show it again.
 */
export const LOCATIONS: Location[] = [];

