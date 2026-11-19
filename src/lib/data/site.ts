export const SITE = {
  name: "Riderzpro",
  tagline: "CAR & BIKE ACCESSORIES",
  support: "Your Car. Your Build. Your Ride.",
  description:
    "Riderzpro makes and sells car accessories in India — interior, exterior, multimedia, covers and guards, utilities, lighting and off-roading parts, fitment-checked for your car and fitted at our garages.",
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

