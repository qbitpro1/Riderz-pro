export const SITE = {
  name: "Riderzpro",
  tagline: "CAR & BIKE ACCESSORIES",
  support: "Your Car. Your Build. Your Ride.",
  description:
    "Riderzpro makes and sells car accessories in India — interior, exterior, multimedia, covers and guards, utilities, lighting and off-roading parts, fitment-checked for your car, with installation available.",
  url: "https://riderzpro.com",
  phone: "+91 98860 44488",
  phoneHref: "tel:+919886044488",
  email: "hello@riderzpro.com",
  instagram: "https://instagram.com/riderzpro",
  youtube: "https://youtube.com/@riderzpro",
  facebook: "https://facebook.com/riderzpro",
  hours: "Mon – Sat · 9:30 AM – 8:00 PM · Sunday by appointment",
  /** The registered company (GSTIN holder) that owns the Riderzpro trademark. Ends with a full stop. */
  legalName: "Motorbotz Automotive Pvt. Ltd.",
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

export const TRUST_POINTS = [
  {
    title: "200-point inspection",
    body: "Engine, transmission, suspension, electricals and body scanned before a car is listed.",
  },
  { title: "RC verification", body: "Registration certificate cross-checked against VAHAN records." },
  { title: "Insurance verification", body: "Policy status, claim history and NCB confirmed in writing." },
  { title: "Service history", body: "Full digital service record shared before you commit." },
  { title: "Ownership verification", body: "Seller identity and ownership chain validated end to end." },
  { title: "Home test drive", body: "We bring the car to you across the city, free of charge." },
  { title: "Transparent pricing", body: "One price. No dealer margin games, no surprise charges." },
  { title: "Documentation assistance", body: "RC transfer, NOC, insurance and loan paperwork handled." },
  { title: "Secure transactions", body: "Escrowed payments, released only once transfer is complete." },
];
