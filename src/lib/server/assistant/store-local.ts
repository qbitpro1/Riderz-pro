import "server-only";

import type { ScreenProduct } from "@/components/vendor/store-screen/types";
import type { AssistantMessage } from "@/lib/assistant/types";
import type { BargainStep } from "../store-sales";
import { askedFor, describe, inr, isHinglish, noLatin, parse, search, withContext, type Candidate, type Intent } from "./local";
import { fits, modelLabel } from "./search";
import type { StoreAction } from "./store";

/**
 * SALESMAN AI'S BASIC MODE, on the free engine (local.ts). The shop screen uses it when Claude isn't
 * switched on for the shop, its daily limit is used up, or it doesn't answer, so the screen never
 * goes quiet. It finds products in this shop's stock, shows them, picks the best of what it showed
 * ("best konsa hai inme?"), adds one when the customer says so, bargains on the shop's ladder
 * (store-sales.ts: 5%, 7%, 8% "last price", 10% only if pushed) within the seller's limits, and
 * opens checkout. It answers in Hinglish when the customer writes Hinglish.
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

export type LocalBargain = {
  /** The next step on the ladder, or null when the current special price is already the top one. */
  next: BargainStep | null;
  /** Percent already agreed in this visit (0 = none). */
  current: number;
  /** Records the offer for the current order (createOffer: the seller's limits are enforced there). */
  make: (percent: number) => Promise<{ ok: true; offer: Extract<StoreAction, { type: "offer" }>["offer"] } | { ok: false; why: string }>;
};

type Reply = { text: string; products: string[]; actions: StoreAction[] };

export async function askStoreLocal(
  products: ScreenProduct[],
  input: {
    messages: AssistantMessage[];
    cart: { id: string; qty: number }[];
    car: string | null;
    storeName: string;
    pay: { onScreen: boolean; atCounter: boolean };
    /** null: bargaining is off for this shop. */
    bargain: LocalBargain | null;
  },
): Promise<Reply> {
  const last = [...input.messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (noLatin(last)) return say("Sorry, I can read English or Hinglish typed in English letters for now. Our staff can help too.");
  const hi = isHinglish(last);
  const t = (en: string, hin: string) => (hi ? hin : en);

  const byId = new Map(products.map((p) => [p.id, p]));
  const cart = input.cart.filter((l) => byId.has(l.id));
  const carName = input.car ? modelLabel(input.car) : null;
  const { intent, shown } = withContext(input.messages, input.car && carName ? { slug: input.car, name: carName } : null);
  const raw = parse(last);
  const all = products.map(candidate);
  const help = t(
    "Tell me your car and what you're looking for, like “seat covers for my Creta” or “dash cam under 5000”.",
    "Apni gaadi aur kya chahiye bataiye, jaise “Creta ke liye seat cover” ya “5000 tak dash cam”.",
  );

  // "Add it", "ye wala", "add karo": the product the customer names, else the pick from the last
  // answer (always its first card).
  if (intent.add) {
    const pick = raw.words.length ? search(all, intent, [], 1).items[0]?.p : shown.length ? byId.get(shown[0]) : undefined;
    if (!pick) return say(t("Which product should I add? Tell me what you're looking for.", "Kaunsa product add karun? Bataiye kya chahiye."));
    const inOrder = cart.find((l) => l.id === pick.id)?.qty ?? 0;
    if (inOrder + 1 > pick.stock) return { text: t(`Sorry, we only have ${pick.stock} of ${pick.title} in stock.`, `Maaf kijiye, ${pick.title} ke sirf ${pick.stock} piece stock mein hain.`), products: [pick.id], actions: [] };
    return {
      text: t(`Added ${pick.title} (${inr(pick.price)}) to your order. Anything else, or shall we check out?`, `${pick.title} (${inr(pick.price)}) order mein add kar diya. Aur kuch chahiye, ya checkout karein?`),
      products: [pick.id],
      actions: [{ type: "add", id: pick.id, qty: 1 }],
    };
  }

  if (intent.topic === "bargain") return bargain(input.bargain, cart.length > 0, t);

  const fixed = topicReply(intent, cart.length > 0, input.pay, input.storeName, help, t);
  if (fixed) return { text: fixed.text, products: [], actions: fixed.checkout ? [{ type: "checkout" }] : [] };

  // "Best konsa hai inme?", "which one is better": choose among the products just shown.
  const onScreen = shown.map((id) => byId.get(id)).filter((p): p is ScreenProduct => Boolean(p));
  if (raw.pick && raw.words.length === 0 && onScreen.length >= 2) return bestOf(onScreen, intent.car?.slug ?? null, t);

  if (intent.words.length === 0 && !intent.car && intent.sort === "relevance") return say(t(`Welcome to ${input.storeName}! ${help}`, `${input.storeName} mein swagat hai! ${help}`));

  const found = search(all, intent, shown, SHOW);
  if (!found.items.length && intent.cheaper && onScreen.length) {
    const asc = [...onScreen].sort((a, b) => a.price - b.price);
    return {
      text: t(`These are already our lowest-priced ones. The cheapest is ${asc[0].title} at ${inr(asc[0].price)}.`, `Ye already sabse kam daam wale hain. Sabse sasta: ${asc[0].title}, ${inr(asc[0].price)}.`),
      products: asc.map((p) => p.id),
      actions: [],
    };
  }
  if (!found.items.length) {
    const what = intent.words.join(" ");
    return say(
      intent.more
        ? t("That's everything we have for this here. Ask our staff if you need something else.", "Iske liye bas itna hi hai. Kuch aur chahiye to hamare staff se poochhiye.")
        : t(`We don't have “${what}” in stock here right now. Try another product, or ask our staff.`, `Abhi “${what}” stock mein nahi hai. Koi aur product bataiye, ya staff se poochhiye.`),
    );
  }
  const top = found.items[0].p;
  const ids = found.items.map((c) => c.id);
  const saving = top.mrp > top.price ? t(`, ${inr(top.mrp - top.price)} off MRP`, `, MRP se ${inr(top.mrp - top.price)} kam`) : "";
  if (hi) {
    const n = found.items.length;
    return { text: `${found.note ? `${found.note} ` : `${n} ${n === 1 ? "product" : "products"} stock mein hain: ${askedFor(intent)}${intent.car ? ` (${intent.car.name})` : ""}. `}Mera pick: ${top.title}, ${inr(top.price)}${saving}. Details ke liye product dabaiye, ya boliye “add karo”.`, products: ids, actions: [] };
  }
  const what = intent.words.length ? askedFor(intent) : "our best picks";
  return { text: `${found.note ?? describe(intent, found.items.length, what).replace("options", "products in stock")} My pick: ${top.title} at ${inr(top.price)}${saving}. Tap a product for details, or say “add it”.`, products: ids, actions: [] };
}

const say = (text: string): Reply => ({ text, products: [], actions: [] });

type T = (en: string, hin: string) => string;

/** Rank what was shown: fits the customer's car, longer warranty, bigger saving, more listed features. */
function bestOf(items: ScreenProduct[], car: string | null, t: T): Reply {
  const score = (p: ScreenProduct) =>
    (car && fits(p.universal ? ["universal"] : p.fitSlugs, car) && !p.universal ? 20 : 0) +
    (p.warrantyMonths ?? 0) +
    (p.mrp > p.price ? ((p.mrp - p.price) / p.mrp) * 40 : 0) +
    Math.min(p.highlights.length, 6);
  const ranked = [...items].sort((a, b) => score(b) - score(a));
  const best = ranked[0];
  const why: string[] = [];
  if (car && !best.universal && fits(best.fitSlugs, car)) why.push(t(`made for your ${modelLabel(car)}`, `aapki ${modelLabel(car)} ke liye bana hai`));
  if (best.warrantyMonths) why.push(t(`${best.warrantyMonths}-month warranty`, `${best.warrantyMonths} mahine ki warranty`));
  if (best.mrp > best.price) why.push(t(`${inr(best.mrp - best.price)} off MRP`, `MRP se ${inr(best.mrp - best.price)} kam`));
  if (why.length < 2 && best.highlights[0]) why.push(best.highlights[0]);
  const cheaper = ranked.filter((p) => p.price < best.price).sort((a, b) => a.price - b.price)[0];
  const reason = why.length ? `: ${why.join(", ")}` : "";
  const alt = cheaper
    ? t(` If you'd like to spend less, ${cheaper.title} at ${inr(cheaper.price)} is a good choice.`, ` Budget kam rakhna ho to ${cheaper.title}, ${inr(cheaper.price)} bhi accha hai.`)
    : "";
  return {
    text: t(`Of these, I'd pick ${best.title} at ${inr(best.price)}${reason}.${alt} Say “add it” to put it in your order.`, `Inme se mera pick: ${best.title}, ${inr(best.price)}${reason}.${alt} Lena ho to boliye “add karo”.`),
    products: [best.id, ...(cheaper ? [cheaper.id] : [])],
    actions: [],
  };
}

/** One step up the shop's ladder each time the customer asks again. */
async function bargain(b: LocalBargain | null, hasOrder: boolean, t: T): Promise<Reply> {
  if (!b) return say(t("The prices on this screen are already our best. Where a product shows MRP, you're saving that much. For anything more, please ask our staff at the counter.", "Screen par jo price hai wahi best price hai. Jahan MRP dikh raha hai, utni bachat already hai. Aur kuch ho to counter par staff se baat kijiye."));
  if (!hasOrder) return say(t("Add what you like to your order first, then I'll give you my best price.", "Pehle jo pasand hai order mein add kijiye, phir main best price bataunga."));
  if (!b.next) {
    return say(
      b.current
        ? t(`${b.current}% off is already my final price. Shall we check out?`, `${b.current}% off already final price hai. Checkout karein?`)
        : t("The prices on this screen are already our best.", "Screen par jo price hai wahi best price hai."),
    );
  }
  const r = await b.make(b.next.percent);
  if (!r.ok) return say(t("The prices on this screen are already our best. Please ask our staff at the counter.", "Screen par jo price hai wahi best price hai. Counter par staff se baat kijiye."));
  const { offer } = r;
  const pct = b.next.percent;
  const total = inr(offer.total);
  const valid = t(` Valid for ${offer.validMinutes} minutes.`, ` ${offer.validMinutes} minute tak valid.`);
  const text = {
    first: t(`For you I can do ${pct}% off: ${total} instead of ${inr(offer.subtotal)}.${valid}`, `Aapke liye ${pct}% kam kar deta hoon: ${inr(offer.subtotal)} ki jagah ${total}.${valid}`),
    more: t(`Alright, ${pct}% off: ${total}. That's a very good price.${valid}`, `Chaliye, ${pct}% off: ${total}. Bahut accha price hai.${valid}`),
    last: t(`My last price: ${pct}% off, ${total}. I can't go lower than this.${valid}`, `Last price: ${pct}% off, ${total}. Isse kam nahi ho payega.${valid}`),
    final: t(`Only for you: ${pct}% off, ${total}. This is my final price.${valid}`, `Sirf aapke liye: ${pct}% off, ${total}. Ye bilkul final price hai.${valid}`),
  }[b.next.kind];
  return { text, products: [], actions: [{ type: "offer", offer }] };
}

function topicReply(intent: Intent, hasOrder: boolean, pay: { onScreen: boolean; atCounter: boolean }, shop: string, help: string, t: T): { text: string; checkout?: boolean } | null {
  const pays = [pay.onScreen ? t("on this screen with UPI or card", "isi screen par UPI ya card se") : null, pay.atCounter ? t("at our counter", "counter par") : null].filter(Boolean).join(t(" or ", " ya "));
  switch (intent.topic) {
    case "checkout":
      return hasOrder ? { text: t(`Great, let's check out. You can pay ${pays}.`, `Badhiya, checkout karte hain. Payment ${pays} kar sakte hain.`), checkout: true } : { text: t("Your order is empty. Tell me what you're looking for and I'll find it.", "Order abhi khaali hai. Bataiye kya chahiye, main dhoondh deta hoon.") };
    case "payment":
      return { text: t(`You can pay ${pays}.`, `Payment ${pays} kar sakte hain.`) };
    case "greeting":
      return intent.words.length ? null : { text: t(`Hi, welcome to ${shop}! ${help}`, `Namaste, ${shop} mein swagat hai! ${help}`) };
    case "thanks":
      return intent.words.length ? null : { text: t("You're welcome! Anything else for your car?", "Koi baat nahi! Gaadi ke liye aur kuch chahiye?") };
    case "returns":
    case "delivery":
    case "order_status":
    case "contact":
    case "installation":
      return intent.words.length ? null : { text: t("Our staff at the counter will help you with that.", "Iske liye counter par hamare staff aapki madad karenge.") };
    case "warranty":
      return intent.words.length ? null : { text: t("Each product shows its warranty when you tap it. Tell me which product and I'll find it.", "Har product dabane par uski warranty dikhti hai. Kaunsa product, bataiye.") };
    default:
      return null;
  }
}
