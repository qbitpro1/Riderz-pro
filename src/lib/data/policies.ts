export type Policy = {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  sections: { heading: string; body: string[] }[];
};

export const SUPPORT_POLICIES: Policy[] = [
  {
    slug: "shipping",
    title: "SHIPPING",
    eyebrow: "Customer support",
    intro:
      "We ship accessories across India. Large items — body kits, roof racks, exhausts — travel by surface freight and are quoted separately at checkout.",
    sections: [
      {
        heading: "Dispatch times",
        body: [
          "In-stock items ordered before 2 PM on a working day are dispatched the same day. Everything else leaves within 48 hours.",
          "Made-to-order items — seat covers, painted spoilers, custom audio enclosures — carry the lead time shown on the product page. We confirm the date on WhatsApp when the order is placed.",
        ],
      },
      {
        heading: "Delivery estimates",
        body: [
          "Metro cities: 2–3 working days. Tier 2 and 3 cities: 3–6 working days. North-east, Jammu & Kashmir, Ladakh and island territories: 6–10 working days.",
          "Oversized freight (body kits, bull bars, roof racks, tyre sets) moves by surface transport and typically takes 5–9 working days.",
        ],
      },
      {
        heading: "Shipping charges",
        body: [
          "Free standard shipping on orders above ₹2,000. Below that, a flat ₹149 applies.",
          "Oversized items are quoted per consignment based on weight and destination. You approve the figure before we bill it.",
        ],
      },
      {
        heading: "Tracking",
        body: [
          "You receive a tracking link on WhatsApp the moment the consignment is picked up, and again when it is out for delivery.",
          "If a consignment stalls for more than 48 hours, we chase the carrier ourselves rather than asking you to.",
        ],
      },
      {
        heading: "Damaged in transit",
        body: [
          "Record a short video while opening any package that arrives visibly damaged. Send it to us within 48 hours and we ship a replacement immediately — no investigation, no arguing with the courier on your time.",
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "RETURNS",
    eyebrow: "Customer support",
    intro:
      "If something doesn't fit, doesn't work or isn't what you expected, we take it back. The whole point of buying from a workshop rather than a marketplace is that someone stands behind the part.",
    sections: [
      {
        heading: "Return window",
        body: [
          "Seven days from delivery for unused items in original packaging, with all fittings and documentation included.",
          "Made-to-order items — custom-cut seat covers, painted panels, custom audio enclosures, bespoke interiors — cannot be returned unless they are defective or do not fit as specified.",
        ],
      },
      {
        heading: "Fitment guarantee",
        body: [
          "If a part we confirmed as compatible does not fit your vehicle, we collect it at our cost and refund you in full — including any installation labour you paid us.",
          "This is why we ask for your variant and year. Give us the wrong details and we can only offer a standard return.",
        ],
      },
      {
        heading: "How to start a return",
        body: [
          "Message us on WhatsApp with your order number and a photo. We arrange reverse pickup in most pin codes within 72 hours.",
          "Refunds are processed within 5 working days of the item reaching us, back to the original payment method.",
        ],
      },
      {
        heading: "Cancellations",
        body: [
          "Orders can be cancelled free of charge until they are dispatched. Made-to-order items can be cancelled until production starts — usually within 24 hours of ordering.",
          "Workshop bookings can be rescheduled free of charge up to 24 hours before the slot.",
        ],
      },
    ],
  },
  {
    slug: "warranty",
    title: "WARRANTY",
    eyebrow: "Customer support",
    intro:
      "Two things are warranted separately: the part, by whoever made it, and our workmanship, by us. We honour both without sending you to a manufacturer's helpline.",
    sections: [
      {
        heading: "Workmanship warranty",
        body: [
          "Twelve months on all installation, wiring, fabrication and trim work carried out at a Riderzpro garage.",
          "If something we fitted rattles, leaks, fails or comes loose within that period, we fix it free — including removing and refitting other parts to get to it.",
        ],
      },
      {
        heading: "Product warranties",
        body: [
          "Each product page lists its own warranty period. Paint protection film is warranted for ten years against yellowing and cracking; ceramic coatings for five years and graphene for seven, subject to annual inspection.",
          "Structural steel — rock sliders, bull bars, roof racks — carries a five-year structural warranty.",
        ],
      },
      {
        heading: "What isn't covered",
        body: [
          "Damage from an accident, off-road impact beyond the product's rating, improper use, or work carried out on the part by another workshop.",
          "Consumables: filters, pads, bulbs, wiper elements and tyres, which are covered by wear limits rather than time.",
        ],
      },
      {
        heading: "Making a claim",
        body: [
          "Message us on WhatsApp with your invoice number. Most claims are resolved with a workshop visit; where a manufacturer replacement is required, we raise it and hand you the replacement — you never deal with the brand directly.",
        ],
      },
    ],
  },
];

export const LEGAL_POLICIES: Policy[] = [
  {
    slug: "privacy",
    title: "PRIVACY POLICY",
    eyebrow: "Legal",
    intro:
      "This policy explains what Riderzpro Automotive Pvt. Ltd. collects, why, and what you can ask us to do about it. Last updated 1 April 2026.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Contact details you give us: name, phone number, email address and delivery address.",
          "Vehicle details you give us: registration number, make, model, variant, year and kilometres, used to confirm fitment and to value a car you want to sell.",
          "Order and service history, so we can honour warranties and re-tune systems we have installed.",
          "Basic analytics about how the website is used. We do not sell this, and we do not build advertising profiles from it.",
        ],
      },
      {
        heading: "Why we collect it",
        body: [
          "To fulfil orders, confirm fitment, schedule workshop slots, arrange finance where you ask for it, and honour warranties.",
          "To contact you about a specific enquiry you started. We do not add you to marketing lists without your consent.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Logistics partners, for delivery. Payment gateways, for processing. Lending partners, only when you ask us to check finance eligibility.",
          "We never sell personal data, and we do not share your vehicle details with third-party marketers.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask us for a copy of what we hold, ask us to correct it, or ask us to delete it, subject to our legal obligation to retain transaction records.",
          "Write to hello@riderzpro.com and we respond within 30 days.",
        ],
      },
      {
        heading: "Cookies",
        body: [
          "We use essential cookies to keep your cart and saved vehicle working, and privacy-preserving analytics to understand which pages are useful. No third-party advertising cookies are set on this site.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "TERMS OF SERVICE",
    eyebrow: "Legal",
    intro:
      "These terms govern purchases, workshop bookings and vehicle transactions with Riderzpro Automotive Pvt. Ltd. Last updated 1 April 2026.",
    sections: [
      {
        heading: "Prices and estimates",
        body: [
          "Prices shown online include GST unless stated otherwise. Build configurator totals are estimates: they become binding only in a written quote issued after a fitment check.",
          "We honour a written quote for 15 days. Where a part price moves because of an import duty or exchange rate change, we tell you before proceeding and you may cancel free of charge.",
        ],
      },
      {
        heading: "Workshop bookings",
        body: [
          "Bookings can be rescheduled free of charge up to 24 hours before the slot. Builds require a 40% deposit to reserve parts; the balance is due at handover.",
          "We photograph every vehicle on arrival. Vehicles left more than 14 days after completion attract storage charges, notified in advance.",
        ],
      },
      {
        heading: "Modifications and the law",
        body: [
          "All work is carried out in line with the Central Motor Vehicles Rules. We do not remove emissions equipment, and we will not carry out modifications that cannot be made road-legal.",
          "Where a modification requires RTO endorsement, insurer notification or re-certification, we tell you in writing before starting. Compliance with those requirements remains the owner's responsibility.",
        ],
      },
      {
        heading: "Vehicle sales",
        body: [
          "Cars are sold with the inspection report shared in advance. Riderzpro Certified cars carry a 5-day / 300 km return window from delivery.",
          "Payment for a car we buy from you is released before the RC transfer application is filed. We settle any outstanding loan directly with the lender.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "Our liability for any claim is limited to the amount you paid for the product or service in question. Nothing in these terms limits liability that cannot be limited under Indian law.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.",
        ],
      },
    ],
  },
];

export function findPolicy(list: Policy[], slug: string): Policy | undefined {
  return list.find((p) => p.slug === slug);
}
