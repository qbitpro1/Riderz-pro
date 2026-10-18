import "server-only";

import type { ScreenProduct } from "@/components/vendor/store-screen/types";
import type { AssistantMessage } from "@/lib/assistant/types";
import { askedFor, describe, inr, noLatin, search, withContext, type Candidate, type Intent } from "./local";
import { modelLabel } from "./search";
import type { StoreAction } from "./store";

/**
 * SALESMAN AI'S BASIC MODE, on the free engine (local.ts). The shop screen uses it when Claude isn't
 * switched on, its daily limit is used up, or it doesn't answer, so the screen never goes quiet.
 * It finds products in this shop's stock, shows them, adds one when the customer says so and opens
 * checkout. It never bargains: special prices need the full Salesman AI (store.ts).
 */

const SHOW = 6;

type Item = Candidate & { p: ScreenProduct };

const candidate = (p: ScreenProduct): Item => ({
  id: p.id,
  title: p.title,
  brand: p.brand,
  category: `${p.department} ${p.groupName}`,
  extra: `${p.summary ?? ""} ${p.highlights.join(" ")}`,
  fitment: p.universal ? ["universal"] : p.fitSlugs,
  price: p.price,
  mrp: p.mrp,
  buyable: true,
  p,
});

const HELP = "Tell me your car and what you're looking for, like “seat covers for my Creta” or “dash cam under 5000”.";

export function askStoreLocal(
  products: ScreenProduct[],
  input: { messages: AssistantMessage[]; cart: { id: string; qty: number }[]; car: string | null; storeName: string; pay: { onScreen: boolean; atCounter: boolean } },
): { text: string; products: string[]; actions: StoreAction[] } {
  const last = [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (noLatin(last)) return { text: "Sorry, I can read English or Hinglish typed in English letters for now. Our staff can help too.", products: [], actions: [] };

  const byId = new Map(products.map((p) => [p.id, p]));
  const cart = input.cart.filter((l) => byId.has(l.id));
  const carName = input.car ? modelLabel(input.car) : null;
  const { intent, shown } = withContext(input.messages, input.car && carName ? { slug: input.car, name: carName } : null);
  const all = products.map(candidate);

  // "Add it", "this one": the product the customer means goes in the order.
  if (intent.add) {
    const pick = intent.words.length ? search(all, intent, [], 1).items[0]?.p : shown.length === 1 ? byId.get(shown[0]) : undefined;
    if (!pick) return { text: shown.length > 1 ? "Which one? Tap “Add to order” under the product you want." : "Which product should I add? Tell me what you're looking for.", products: shown.slice(0, SHOW), actions: [] };
    const inOrder = cart.find((l) => l.id === pick.id)?.qty ?? 0;
    if (inOrder + 1 > pick.stock) return { text: `Sorry, we only have ${pick.stock} of ${pick.title} in stock.`, products: [pick.id], actions: [] };
    return { text: `Added ${pick.title} (${inr(pick.price)}) to your order. Anything else, or shall we check out?`, products: [pick.id], actions: [{ type: "add", id: pick.id, qty: 1 }] };
  }

  const fixed = topicReply(intent, cart.length > 0, input.pay, input.storeName);
  if (fixed) return { text: fixed.text, products: [], actions: fixed.checkout ? [{ type: "checkout" }] : [] };

  if (intent.words.length === 0 && !intent.car && intent.sort === "relevance") return { text: `Welcome to ${input.storeName}! ${HELP}`, products: [], actions: [] };

  const found = search(all, intent, shown, SHOW);
  if (!found.items.length) {
    return {
      text: intent.more ? "That's everything we have for this here. Ask our staff if you need something else." : `We don't have “${intent.words.join(" ")}” in stock here right now. Try another product, or ask our staff.`,
      products: [],
      actions: [],
    };
  }
  const top = found.items[0].p;
  const saving = top.mrp > top.price ? `, ${inr(top.mrp - top.price)} off MRP` : "";
  const pick = ` My pick: ${top.title} at ${inr(top.price)}${saving}. Tap a product for details, or say “add it”.`;
  const what = intent.words.length ? askedFor(intent) : "our best picks";
  return { text: `${found.note ?? describe(intent, found.items.length, what).replace("options", "products in stock")}${pick}`, products: found.items.map((c) => c.id), actions: [] };
}

function topicReply(intent: Intent, hasOrder: boolean, pay: { onScreen: boolean; atCounter: boolean }, shop: string): { text: string; checkout?: boolean } | null {
  const pays = [pay.onScreen ? "on this screen with UPI or card" : null, pay.atCounter ? "at our counter" : null].filter(Boolean).join(" or ");
  switch (intent.topic) {
    case "checkout":
      return hasOrder ? { text: `Great, let's check out. You can pay ${pays}.`, checkout: true } : { text: "Your order is empty. Tell me what you're looking for and I'll find it." };
    case "bargain":
      return { text: "The prices on this screen are already our best. Where a product shows MRP, you're saving that much. For anything more, please ask our staff at the counter." };
    case "payment":
      return { text: `You can pay ${pays}.` };
    case "greeting":
      return intent.words.length ? null : { text: `Hi, welcome to ${shop}! ${HELP}` };
    case "thanks":
      return intent.words.length ? null : { text: "You're welcome! Anything else for your car?" };
    case "returns":
    case "delivery":
    case "order_status":
    case "contact":
    case "installation":
      return intent.words.length ? null : { text: "Our staff at the counter will help you with that." };
    case "warranty":
      return intent.words.length ? null : { text: "Each product shows its warranty when you tap it. Tell me which product and I'll find it." };
    default:
      return null;
  }
}
