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
