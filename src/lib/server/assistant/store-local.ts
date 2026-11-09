import "server-only";

import type { ScreenProduct } from "@/components/vendor/store-screen/types";
import type { AssistantMessage } from "@/lib/assistant/types";
import type { BargainStep } from "../store-sales";
import { askedFor, describe, inr, isHinglish, noLatin, parse, search, withContext, type Candidate, type Intent } from "./local";
import { fits, modelLabel, words } from "./search";
import { DEPARTMENTS } from "@/lib/data/taxonomy";
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
  category: `${p.department} ${p.groupName} ${p.subName ?? ""} ${p.typeName}`,
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
  const { intent: said, shown } = withContext(input.messages, input.car && carName ? { slug: input.car, name: carName } : null);
  const raw = parse(last);
  const all = products.map(candidate);
  // Only words that name something a car-accessory shop sells count as the product asked for:
  // "bhaiya mere paas Creta hai, 3000 ke andar" keeps Creta and ₹3000 and drops "bhaiya paas".
  const vocab = productVocabulary(all);
  const intent: Intent = { ...said, words: said.words.filter((w) => vocab.has(w)) };
  const unclear = said.words.length > 0 && intent.words.length === 0;
  const help = t(
    "Tell me your car and what you're looking for, like “seat covers for my Creta” or “dash cam under 5000”.",
    "Apni gaadi aur kya chahiye bataiye, jaise “Creta ke liye seat cover” ya “5000 tak dash cam”.",
  );

  // "Add it", "ye wala", "add karo": the product the customer names, else the pick from the last
  // answer (always its first card).
  if (intent.add) {
    // "Add the first one": "first" names no product, so it means the top card just shown.
    const named = raw.words.filter((w) => vocab.has(w));
    const pick = named.length ? search(all, { ...intent, words: named }, [], 1).items[0]?.p : shown.length ? byId.get(shown[0]) : undefined;
    if (!pick) return say(t("Which product should I add? Tell me what you're looking for.", "Kaunsa product add karun? Bataiye kya chahiye."));
    const inOrder = cart.find((l) => l.id === pick.id)?.qty ?? 0;
    if (inOrder + 1 > pick.stock) return { text: t(`Sorry, we only have ${pick.stock} of ${pick.title} in stock.`, `Maaf kijiye, ${pick.title} ke sirf ${pick.stock} piece stock mein hain.`), products: [pick.id], actions: [] };
    return {
      text: t(`Added ${pick.title} (${inr(pick.price)}) to your order. Anything else, or shall we check out?`, `${pick.title} (${inr(pick.price)}) order mein add kar diya. Aur kuch chahiye, ya checkout karein?`),
      products: [pick.id],
      actions: [{ type: "add", id: pick.id, qty: 1 }],
    };
  }

  // "Too expensive", "bahut mehenga": a price complaint is a request for a better price.
  const priceComplaint = /\b(too (expensive|costly|much|high)|very (expensive|costly)|so (expensive|costly)|mehenga|mehnga|bahut zyada|reduce)\b/i.test(last);
  if (intent.topic === "bargain" || (priceComplaint && intent.words.length === 0)) return bargain(input.bargain, cart.length > 0, t);

  const fixed = topicReply(intent, cart.length > 0, input.pay, input.storeName, help, t);
  if (fixed) return { text: fixed.text, products: [], actions: fixed.checkout ? [{ type: "checkout" }] : [] };

  // "Best konsa hai inme?", "which one is better": choose among the products just shown.
  const onScreen = shown.map((id) => byId.get(id)).filter((p): p is ScreenProduct => Boolean(p));
  // "Compare the two lights": among those shown, the ones the words name (all of them when none do).
  // With fewer than two on screen, compare the best matches for the words instead.
  if (raw.pick) {
    const named = raw.words.filter((w) => vocab.has(w) && !COUNT_WORDS.has(w));
    const pool = onScreen.length >= 2 ? onScreen : named.length ? search(all, { ...intent, words: named }, [], SHOW).items.map((c) => c.p) : [];
    const matching = named.length && onScreen.length >= 2
      ? pool.filter((p) => {
          const text = new Set(words(`${p.title} ${p.brand} ${p.groupName} ${p.subName ?? ""} ${p.typeName}`));
          return named.every((w) => text.has(w));
        })
      : pool;
    if (matching.length >= 2) return bestOf(matching, intent.car?.slug ?? null, t);
    if (pool.length >= 2 && !named.length) return bestOf(pool, intent.car?.slug ?? null, t);
    if (pool.length === 1) {
      return { ...say(t(`We have just one of those: ${pool[0].title} at ${inr(pool[0].price)}. Say “add it” to put it in your order.`, `Iska ek hi option hai: ${pool[0].title}, ${inr(pool[0].price)}. “Add karo” boliye to order mein daal dunga.`)), products: [pool[0].id] };
    }
  }

  if (intent.words.length === 0 && !intent.car && intent.sort === "relevance" && intent.min === null && intent.max === null) {
    if (!unclear) return say(t(`Welcome to ${input.storeName}! ${help}`, `${input.storeName} mein swagat hai! ${help}`));
    // Not sure what they want: ask, with what this shop actually has.
    const kinds = [...new Set(products.map((p) => p.groupName).filter(Boolean))].slice(0, 4).join(", ");
    return say(
      t(
        `Happy to help! Which car do you drive, and what are you looking for${kinds ? ` (we have ${kinds})` : ""}? A budget helps too.`,
        `Zaroor madad karunga! Aapki gaadi kaunsi hai, aur kya chahiye${kinds ? ` (hamare paas ${kinds} hai)` : ""}? Budget bhi bata dijiye.`,
      ),
    );
  }

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

/** "Compare the two", "dono mein": counting words, not product names. */
const COUNT_WORDS = new Set(["two", "both", "three", "first", "second", "third", "dono", "teeno", "teen"]);

/** Common car-accessory words a shop may not stock, so "tyres?" still gets an honest "we don't have tyres". */
const ACCESSORY_WORDS = "tyre tire wheel alloy rim battery oil horn wiper bulb helmet charger perfume freshener cover mat light camera stereo speaker sensor polish wax";

/** Words that name something sellable: this shop's products and the site's departments and categories. */
function productVocabulary(all: Candidate[]): Set<string> {
  const v = new Set<string>();
  const add = (s: string) => words(s).forEach((w) => v.add(w));
  for (const c of all) [c.title, c.brand, c.category, c.extra].forEach(add);
  for (const d of DEPARTMENTS) [d.name, ...d.groups.map((g) => g.name)].forEach(add);
  add(ACCESSORY_WORDS);
  return v;
}

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
  const total = inr(offer.total);
  // When a product's lowest price held the discount back, name the real saving in rupees, not the
  // ladder's percent (e.g. "₹10 off", never "5% off" for a ₹10 saving).
  const held = offer.percent !== b.next.percent;
  const off = held ? `${inr(offer.discount)} off` : `${b.next.percent}% off`;
  const kam = held ? `${inr(offer.discount)} kam` : `${b.next.percent}% kam`;
  const valid = t(` Valid for ${offer.validMinutes} minutes.`, ` ${offer.validMinutes} minute tak valid.`);
  const text = {
    first: t(`For you I can do ${off}: ${total} instead of ${inr(offer.subtotal)}.${valid}`, `Aapke liye ${kam} kar deta hoon: ${inr(offer.subtotal)} ki jagah ${total}.${valid}`),
    more: t(`Alright, ${off}: ${total}. That's a very good price.${valid}`, `Chaliye, ${off}: ${total}. Bahut accha price hai.${valid}`),
    last: t(`My last price: ${off}, ${total}. I can't go lower than this.${valid}`, `Last price: ${off}, ${total}. Isse kam nahi ho payega.${valid}`),
    final: t(`Only for you: ${off}, ${total}. This is my final price.${valid}`, `Sirf aapke liye: ${off}, ${total}. Ye bilkul final price hai.${valid}`),
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
