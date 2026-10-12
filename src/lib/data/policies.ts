import { SITE } from "@/lib/data/site";
import { FREE_SHIPPING_OVER, SHIPPING_FEE } from "@/lib/store/shipping";

export type PolicySection = {
  /** Anchor id — FAQ answers deep-link to `/{route}#{id}`. Keep stable. */
  id: string;
  heading: string;
  body: string[];
};

export type Policy = {
  slug: string;
  title: string;
  eyebrow: string;
  intro: string;
  /** Short search/share description; falls back to `intro` when absent. */
  metaDescription?: string;
  sections: PolicySection[];
};

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** `SITE.legalName` already ends with a full stop ("… Pvt. Ltd."). */
const COMPANY = SITE.legalName;

export const SUPPORT_POLICIES: Policy[] = [
  {
    slug: "shipping",
    title: "SHIPPING & DELIVERY",
    eyebrow: "Customer support",
    intro:
      "We ship accessories across India. Large items — body kits, roof racks, exhausts — travel by surface freight and are quoted separately.",
    sections: [
      {
        id: "dispatch",
        heading: "Dispatch times",
        body: [
          "In-stock items ordered before 2 PM on a working day are dispatched the same day. Everything else leaves within 48 hours.",
          "Made-to-order items — seat covers, painted spoilers, custom audio enclosures — carry the lead time shown on the product page. We confirm the date on WhatsApp when the order is placed. They follow the made-to-order terms on the Returns page.",
        ],
      },
      {
        id: "delivery-times",
        heading: "Delivery estimates",
        body: [
          "Metro cities: 2–3 working days. Tier 2 and 3 cities: 3–6 working days. North-east, Jammu & Kashmir, Ladakh and island territories: 6–10 working days.",
          "Oversized freight (body kits, bull bars, roof racks, tyre sets) moves by surface transport and typically takes 5–9 working days.",
        ],
      },
      {
        id: "charges",
        heading: "Shipping charges",
        body: [
          `Free standard shipping on orders of ${rupees(FREE_SHIPPING_OVER)} or more. Below that, a flat ${rupees(SHIPPING_FEE)} applies.`,
          "Oversized items are quoted per consignment based on weight and destination. You approve the figure before we bill it.",
        ],
      },
      {
        id: "tracking",
        heading: "Order tracking",
        body: [
          "You receive a tracking link on WhatsApp the moment the consignment is picked up, and again when it is out for delivery. Orders are confirmed on WhatsApp today, so that is also where updates reach you.",
          "If a consignment stalls for more than 48 hours, we chase the carrier ourselves rather than asking you to.",
          "Not sure where your order is? Use the Track your order page and we will pick it up on WhatsApp.",
        ],
      },
      {
        id: "damaged-or-missing",
        heading: "Damaged or missing items",
        body: [
          "Record a short video while opening any package that arrives visibly damaged. Send it to us within 48 hours and we ship a replacement immediately — no investigation, no arguing with the courier on your time.",
          "If something is missing from your parcel, message us on WhatsApp with your order number and a photo of what arrived, and we will confirm the next step with you there.",
        ],
      },
    ],
  },
  {
    slug: "returns",
    title: "RETURNS, REFUNDS & CANCELLATIONS",
    eyebrow: "Customer support",
    intro:
      "If something doesn't fit, doesn't work or isn't what you expected, we take it back. The whole point of buying from a maker with its own garages rather than a marketplace is that someone stands behind the part.",
    sections: [
      {
        id: "return-window",
        heading: "Return window",
        body: [
          "Seven days from delivery for unused items in original packaging, with all fittings and documentation included.",
        ],
      },
      {
        id: "fitment-guarantee",
        heading: "Fitment guarantee",
        body: [
          "If a part we confirmed as compatible does not fit your vehicle, we collect it at our cost and refund you in full — including any installation labour you paid us.",
          "This is why we ask for your variant and year. Give us the wrong details and we can only offer a standard return.",
        ],
      },
      {
        id: "made-to-order",
        heading: "Made-to-order items",
        body: [
          "Made-to-order items — custom-cut seat covers (including Autoform sets), painted panels, custom audio enclosures, bespoke interiors — cannot be returned unless they are defective or do not fit as specified.",
          "Made-to-order items can be cancelled until production starts — usually within 24 hours of ordering.",
        ],
      },
      {
        id: "start-a-return",
        heading: "How to start a return",
        body: [
          "Message us on WhatsApp with your order number and a photo. We arrange reverse pickup in most pin codes within 72 hours.",
        ],
      },
      {
        id: "refunds",
        heading: "Refunds",
        body: [
          "Refunds are processed within 5 working days of the item reaching us, back to the original payment method.",
        ],
      },
      {
        id: "cancellations",
        heading: "Cancellations",
        body: [
          "Orders can be cancelled free of charge until they are dispatched. Message us on WhatsApp with your order number.",
          "Made-to-order items can be cancelled until production starts — usually within 24 hours of ordering.",
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
        id: "workmanship",
        heading: "Workmanship warranty",
        body: [
          "Twelve months on all installation, wiring, fabrication and trim work carried out at a Riderzpro garage.",
          "If something we fitted rattles, leaks, fails or comes loose within that period, we fix it free — including removing and refitting other parts to get to it.",
        ],
      },
      {
        id: "product-warranties",
        heading: "Product warranties",
        body: [
          "Each product page lists its own warranty period. Paint protection film is warranted for ten years against yellowing and cracking; ceramic coatings for five years and graphene for seven, subject to annual inspection.",
          "Structural steel — rock sliders, bull bars, roof racks — carries a five-year structural warranty.",
        ],
      },
      {
        id: "exclusions",
        heading: "What isn't covered",
        body: [
          "Damage from an accident, off-road impact beyond the product's rating, improper use, or work carried out on the part by another workshop.",
          "Consumables: filters, pads, bulbs, wiper elements and tyres, which are covered by wear limits rather than time.",
        ],
      },
      {
        id: "claims",
        heading: "Making a warranty claim",
        body: [
          "Message us on WhatsApp with your invoice number. Most claims are resolved with a workshop visit; where a manufacturer replacement is required, we raise it and hand you the replacement — you never deal with the brand directly.",
          "If you are not near one of our garages, tell us on WhatsApp and we will confirm how your claim will be handled.",
        ],
      },
    ],
  },
  {
    slug: "installation",
    title: "INSTALLATION & BOOKINGS",
    eyebrow: "Customer support",
    intro:
      "You can have what you buy fitted at a Riderzpro garage in Bengaluru, Hyderabad or Pune. Workmanship is warranted by the garage that did the work.",
    sections: [
      {
        id: "booking",
        heading: "Booking a fitting",
        body: [
          "Add installation to a product where it is offered, or book a slot with the form on the Contact page or on WhatsApp. We confirm your slot with you there.",
          "Autoform seat covers are made to order for your car: we take the order, confirm the pattern for your exact variant, and fit it at the workshop.",
        ],
      },
      {
        id: "reschedule",
        heading: "Rescheduling",
        body: ["Workshop bookings can be rescheduled free of charge up to 24 hours before the slot."],
      },
      {
        id: "builds",
        heading: "Larger builds",
        body: [
          "Quotes, deposits and storage for larger builds are covered in the Workshop bookings section of our Terms of Service.",
        ],
      },
      {
        id: "workmanship",
        heading: "Workmanship warranty",
        body: [
          "Twelve months on all installation, wiring, fabrication and trim work carried out at a Riderzpro garage. The full terms are on the Warranty page.",
        ],
      },
    ],
  },
  {
    slug: "payments",
    title: "PAYMENTS",
    eyebrow: "Customer support",
    intro: "How you pay for an order today, and what is changing.",
    sections: [
      {
        id: "how-to-pay",
        heading: "How payment works today",
        body: [
          "Orders are currently confirmed over WhatsApp. We check fitment against your variant, confirm the total, and tell you how to pay in that conversation before anything is dispatched.",
          "Online payment on the website is coming. Until it is switched on, payment details are shared only on WhatsApp.",
        ],
      },
      {
        id: "prices",
        heading: "Prices and GST",
        body: [
          "Prices shown online include GST unless stated otherwise. Shipping is added as described on the Shipping page.",
        ],
      },
      {
        id: "refund-method",
        heading: "Refunds",
        body: ["Refunds go back to the original payment method within 5 working days of the item reaching us."],
      },
    ],
  },
];

export const LEGAL_POLICIES: Policy[] = [
  {
    slug: "privacy",
    title: "PRIVACY POLICY",
    eyebrow: "Legal",
    metaDescription: "What personal information Riderzpro collects, why we collect it, and how to access, correct or delete it.",
    intro: `This policy is issued by ${COMPANY} It owns the Riderzpro trademark and runs this store. It explains what we collect, why, and what you can ask us to do about it.`,
    sections: [
      {
        id: "on-this-site",
        heading: "What this website stores",
        body: [
          "There are no customer accounts yet. Your cart, your saved car, your theme choice, your recently viewed products and your wishlist are kept in your browser's local storage, on your own device. We do not receive them unless you send them to us.",
          "You can clear this at any time from your browser settings. Doing so empties your cart and forgets your saved car.",
        ],
      },
      {
        id: "what-we-collect",
        heading: "What we collect from you",
        body: [
          "Enquiries and orders reach us on WhatsApp, by phone or by email. That means the contact details you give us — name, phone number, email address and delivery address — and, where you give it, the vehicle detail we need to confirm fitment: make, model, variant and year.",
          "Order and service history, so we can honour warranties and re-tune systems we have installed.",
        ],
      },
      {
        id: "why",
        heading: "Why we collect it",
        body: [
          "To fulfil orders, confirm fitment, schedule workshop slots and honour warranties.",
          "To contact you about a specific enquiry you started. We do not add you to marketing lists without your consent.",
        ],
      },
      {
        id: "sharing",
        heading: "Who we share it with",
        body: [
          "Logistics partners, for delivery. Payment processors, once online payment is switched on.",
          "We never sell personal data, and we do not share your vehicle details with third-party marketers.",
        ],
      },
      {
        id: "cookies",
        heading: "Cookies",
        body: [
          "This site does not set advertising cookies. Its own functions use your browser's local storage, as described above.",
        ],
      },
      {
        id: "your-rights",
        heading: "Your rights and grievances",
        body: [
          "You can ask us for a copy of what we hold, ask us to correct it, or ask us to delete it, subject to our legal obligation to retain transaction records.",
          `Write to ${SITE.email} and we respond within 30 days.`,
        ],
      },
      {
        id: "cars",
        heading: "Buying or selling a car with us",
        body: [
          "If you buy or sell a car with us we also collect the vehicle's registration number, make, model, variant, year and kilometres, to value the car and complete the transfer.",
          "We arrange finance only where you ask for it, and share your details with lending partners only when you ask us to check finance eligibility.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "TERMS OF SERVICE",
    eyebrow: "Legal",
    metaDescription: "The terms for buying from Riderzpro: online orders, workshop bookings and vehicle transactions.",
    intro: `These terms govern purchases from this website, workshop bookings and vehicle transactions. The seller is ${COMPANY} It owns the Riderzpro trademark.`,
    sections: [
      {
        id: "orders-and-prices",
        heading: "Orders, prices and estimates",
        body: [
          "Prices shown online include GST unless stated otherwise. Orders are confirmed with you on WhatsApp before dispatch. Build configurator totals are estimates: they become binding only in a written quote issued after a fitment check.",
          "We honour a written quote for 15 days. Where a part price moves because of an import duty or exchange rate change, we tell you before proceeding and you may cancel free of charge.",
        ],
      },
      {
        id: "delivery-returns",
        heading: "Delivery, returns, cancellations and warranty",
        body: [
          "Delivery, returns and refunds, cancellations and warranty are set out on the Shipping, Returns and Warranty pages, which form part of these terms.",
        ],
      },
      {
        id: "workshop-bookings",
        heading: "Workshop bookings",
        body: [
          "Bookings can be rescheduled free of charge up to 24 hours before the slot. Builds require a 40% deposit to reserve parts; the balance is due at handover.",
          "We photograph every vehicle on arrival. Vehicles left more than 14 days after completion attract storage charges, notified in advance.",
        ],
      },
      {
        id: "modifications-and-the-law",
        heading: "Modifications and the law",
        body: [
          "All work is carried out in line with the Central Motor Vehicles Rules. We do not remove emissions equipment, and we will not carry out modifications that cannot be made road-legal.",
          "Where a modification requires RTO endorsement, insurer notification or re-certification, we tell you in writing before starting. Compliance with those requirements remains the owner's responsibility.",
        ],
      },
      {
        id: "liability",
        heading: "Liability",
        body: [
          "Our liability for any claim is limited to the amount you paid for the product or service in question. Nothing in these terms limits liability that cannot be limited under Indian law.",
        ],
      },
      {
        id: "governing-law",
        heading: "Governing law",
        body: [
          "These terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.",
        ],
      },
      {
        id: "vehicle-sales",
        heading: "Buying or selling a car with us",
        body: [
          "Cars are sold with the inspection report shared in advance. Riderzpro Certified cars carry a 5-day / 300 km return window from delivery.",
          "Payment for a car we buy from you is released before the RC transfer application is filed. We settle any outstanding loan directly with the lender.",
        ],
      },
    ],
  },
];

export function findPolicy(list: Policy[], slug: string): Policy | undefined {
  return list.find((p) => p.slug === slug);
}
