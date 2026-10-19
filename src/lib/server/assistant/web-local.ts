import "server-only";

import { CATALOG } from "@/lib/catalog";
import type { ShopItem } from "@/lib/catalog/types";
import { DEPARTMENT_BY_SLUG, DEPARTMENTS } from "@/lib/data/taxonomy";
import { SITE } from "@/lib/data/site";
import { FREE_SHIPPING_OVER, SHIPPING_FEE } from "@/lib/store/shipping";
import { couponOffer } from "@/lib/coupons/types";
import { liveVendorItems } from "../marketplace";
import { publicCoupons } from "../coupons";
import { askedFor, describe, inr, noLatin, search, withContext, type Candidate, type Intent } from "./local";
import { modelLabel } from "./search";
import type { AssistantMessage } from "@/lib/assistant/types";

/**
 * THE WEBSITE'S ASK AI, on the free engine (local.ts): Riderzpro's own catalogue and approved
 * sellers' live products, public fields only. Fixed answers for returns, delivery and the like come
 * from the support pages (src/lib/data/policies.ts) so the two never disagree.
 */

const SHOW = 6;

const GROUP_NAME = new Map(DEPARTMENTS.flatMap((d) => d.groups.flatMap((g) => g.subs.map((s) => [`${d.slug}|${s.toLowerCase()}`, g.name] as const))));

type Item = Candidate & { item: ShopItem };

function candidate(i: ShopItem): Item {
  const group = GROUP_NAME.get(`${i.category}|${i.sub.toLowerCase()}`) ?? "";
  return {
    id: i.id,
    title: i.title,
    brand: i.brandName,
    category: `${DEPARTMENT_BY_SLUG[i.category]?.name ?? i.category} ${group} ${i.sub}`,
    extra: `${i.keywords} ${i.code ?? ""}`,
    fitment: i.fitment,
    price: i.buyable ? i.price : null,
    mrp: i.buyable ? i.mrp : null,
    buyable: i.buyable,
    item: i,
  };
}

const HELP = "Tell me your car and what you're after, for example “seat covers for my Creta under ₹8,000” or “dash cam under 5k”.";

async function topicReply(intent: Intent, onlinePay: boolean): Promise<string | null> {
  switch (intent.topic) {
    case "greeting":
      return `Hi! I can find car accessories that fit your car. ${HELP}`;
    case "thanks":
      return "You're welcome. Ask me anything else about parts for your car.";
    case "returns":
      return "You can return unused items in their original packaging within 7 days of delivery. Made-to-order items (custom seat covers, painted parts) can only be returned if they're defective or don't fit as specified. If a part we confirmed for your car doesn't fit, we collect it and refund you in full. Refunds reach you within 5 working days of the item getting back to us. Details: Returns page under Support.";
    case "delivery":
      return `Delivery is free on orders of ${inr(FREE_SHIPPING_OVER)} or more; below that it's a flat ${inr(SHIPPING_FEE)}. In-stock items ordered before 2 PM on a working day leave the same day. Metro cities take 2–3 working days, other cities 3–6. Made-to-order items show their lead time on the product page.`;
    case "installation":
      return "Products marked with the wrench can be fitted at our garages; the fitting price and time show on the product page, and you can add fitting in the cart. Workmanship at a Riderzpro garage has a 12-month warranty.";
    case "payment":
      return onlinePay
        ? "Pay online at checkout with UPI, card or net banking. Your order is confirmed as soon as the payment goes through."
        : "Place your order at checkout and our team confirms the payment with you.";
    case "order_status":
      return "To see your order, sign in under Account → My orders, or use Track your order with your order number and mobile.";
    case "warranty":
      return "Each product's warranty is on its product page (it comes from the maker). Installation done at a Riderzpro garage has our own 12-month workmanship warranty. Tell me a product and I'll find it.";
    case "contact":
      return `You can call us on ${SITE.phone} (${SITE.hours}) or email ${SITE.email}. The Contact page has all our garages.`;
    case "bargain":
      return "Online prices are fixed, but coupon codes often take more off Riderzpro's own products. Ask me “any offers?” to see the codes running now.";
    case "offers": {
      const codes = (await publicCoupons()).slice(0, 4);
      if (!codes.length) return "There are no coupon codes running right now. Ask me for “biggest discount” to see the products with the biggest saving.";
      return `Codes running now: ${codes.map((c) => `${c.code} (${couponOffer(c)}${c.minOrder ? `, orders over ${inr(c.minOrder)}` : ""})`).join("; ")}. They apply to Riderzpro's own products at checkout. See all on the Offers page.`;
    }
    default:
      return null;
  }
}

export async function askWebLocal(history: AssistantMessage[], garageSlug: string | null, onlinePay: boolean): Promise<{ text: string; products: ShopItem[] }> {
  const last = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  if (noLatin(last)) return { text: "Sorry, I can read English or Hinglish typed in English letters for now, like “creta ke liye seat cover”.", products: [] };

  const garageName = garageSlug ? modelLabel(garageSlug) : null;
  const { intent, shown } = withContext(history, garageSlug && garageName ? { slug: garageSlug, name: garageName } : null);

  // Returns, delivery, payment, order status and contact always get the fixed answer; the rest
  // (installation, warranty, offers…) only when no product was named.
  const always = intent.topic === "returns" || intent.topic === "delivery" || intent.topic === "payment" || intent.topic === "order_status" || intent.topic === "contact";
  const fixed = always || intent.words.length === 0 ? await topicReply(intent, onlinePay) : null;
  if (fixed) return { text: fixed, products: [] };

  if (intent.words.length === 0 && !intent.car && intent.sort === "relevance") return { text: `I didn't catch which product you need. ${HELP}`, products: [] };

  const all = [...CATALOG, ...(await liveVendorItems())].map(candidate);
  const found = search(all, intent, shown, SHOW);
  if (!found.items.length) {
    return {
      text: intent.more
        ? "That's everything I have for this. Try another product, or a different budget."
        : `I couldn't find “${intent.words.join(" ")}”${intent.car ? ` for the ${intent.car.name}` : ""}. Try other words (seat cover, floor mat, dash cam, LED bulb, speaker), or browse the Shop.`,
      products: [],
    };
  }

  const what = intent.words.length ? askedFor(intent) : "popular parts";
  const top = found.items[0];
  const pick = top.price !== null ? ` Top pick: ${top.title} at ${inr(top.price)}${top.item.seller ? `, sold by ${top.item.seller.name}` : ""}.` : "";
  const fit = intent.car ? " Each product page confirms fitment." : " Tell me your car to see only parts that fit.";
  const text = found.note ? `${found.note}${pick}` : `${describe(intent, found.items.length, what)}${pick}${fit}`;
  return { text, products: found.items.map((c) => c.item) };
}
