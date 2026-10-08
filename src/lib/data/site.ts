export const SITE = {
  name: "Riderzpro",
  tagline: "BUY. BUILD. DRIVE.",
  support: "Your Car. Your Build. Your Ride.",
  description:
    "Riderzpro is India's automotive ecosystem — buy and sell verified cars, build them at our workshop, and shop accessories, audio, PPF, off-road and performance upgrades.",
  url: "https://riderzpro.com",
  phone: "+91 98860 44488",
  phoneHref: "tel:+919886044488",
  whatsappNumber: "919886044488",
  email: "hello@riderzpro.com",
  instagram: "https://instagram.com/riderzpro",
  youtube: "https://youtube.com/@riderzpro",
  facebook: "https://facebook.com/riderzpro",
  hours: "Mon – Sat · 9:30 AM – 8:00 PM · Sunday by appointment",
  /** The registered company (GSTIN holder) that owns the Riderzpro trademark. Ends with a full stop. */
  legalName: "Motorbotz Automotive Pvt. Ltd.",
  gstin: "29AAJCM4412Q1ZP",
} as const;

/** Deep link into WhatsApp with a pre-filled, context-aware message. */
export function whatsapp(message: string): string {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export type NavItem = { label: string; href: string; blurb?: string };

export const PRIMARY_NAV: NavItem[] = [
  { label: "BE 6", href: "/be-6", blurb: "The flagship — every variant, then built your way" },
  { label: "Buy Cars", href: "/cars", blurb: "Verified, inspected, ready to drive" },
  { label: "Sell Car", href: "/sell", blurb: "Valuation in 60 seconds" },
  { label: "Shop", href: "/shop", blurb: "₹499 to ₹4 lakh, fitment-checked" },
  { label: "Build", href: "/build", blurb: "Configure your car, get a costed quote" },
  { label: "Audio", href: "/audio", blurb: "Component, DSP and signature builds" },
  { label: "PPF", href: "/ppf", blurb: "Film, ceramic, correction, wraps" },
  { label: "Off-Road", href: "/off-road", blurb: "Lift, protection, recovery, expedition" },
  { label: "Garage", href: "/garage", blurb: "Book installation and service" },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "BE 6 Specifications", href: "/be-6/specifications" },
  { label: "RIDERZPRO BE 6 Limited Edition", href: "/be-6/limited-edition" },
  { label: "Shop by Brand", href: "/brands" },
  { label: "RECOIL Catalogue", href: "/recoil" },
  { label: "Build My Audio System", href: "/build-audio" },
  { label: "Compare Products", href: "/compare" },
  { label: "PPF Films & Guide", href: "/ppf/films" },
  { label: "Autoform Seat Covers", href: "/autoform" },
  { label: "Body Kits & Facelifts", href: "/body-kits" },
  { label: "Custom Interiors", href: "/interiors" },
  { label: "Performance", href: "/performance" },
  { label: "Riderzpro Builds", href: "/builds" },
  { label: "Locations", href: "/locations" },
  { label: "List Your Cars", href: "/partners" },
];

export const BOTTOM_NAV = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Cars", href: "/cars", icon: "car" },
  { label: "Shop", href: "/shop", icon: "bag" },
  { label: "Build", href: "/build", icon: "build" },
  { label: "Garage", href: "/garage", icon: "garage" },
] as const;

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

export const LOCATIONS: Location[] = [
  {
    slug: "bengaluru-hq",
    name: "Riderzpro Garage — Bengaluru",
    city: "Bengaluru",
    address: "No. 14, Hosur Main Road, Kudlu Gate, Bengaluru, Karnataka 560068",
    phone: "+91 98860 44488",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kudlu+Gate+Hosur+Road+Bengaluru",
    embedQuery: "Kudlu Gate, Hosur Road, Bengaluru",
    services: ["Build studio", "PPF & detailing", "Audio bay", "Off-road workshop", "Car sales"],
    bays: 12,
    flagship: true,
  },
  {
    slug: "hyderabad",
    name: "Riderzpro Garage — Hyderabad",
    city: "Hyderabad",
    address: "Plot 42, Gachibowli–Miyapur Road, Kondapur, Hyderabad, Telangana 500084",
    phone: "+91 98860 44489",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kondapur+Hyderabad",
    embedQuery: "Kondapur, Hyderabad",
    services: ["Build studio", "PPF & detailing", "Audio bay", "Car sales"],
    bays: 8,
  },
  {
    slug: "pune",
    name: "Riderzpro Garage — Pune",
    city: "Pune",
    address: "Survey 61, Mundhwa–Kharadi Road, Kharadi, Pune, Maharashtra 411014",
    phone: "+91 98860 44490",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Kharadi+Pune",
    embedQuery: "Kharadi, Pune",
    services: ["Accessories & installation", "Audio bay", "Detailing"],
    bays: 6,
  },
];

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
