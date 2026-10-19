import "server-only";

import { ALL_MODELS } from "@/lib/data/vehicles";
import { norm } from "@/lib/search/match";
import { fits, modelLabel, words } from "./search";
import type { AssistantMessage } from "@/lib/assistant/types";

/**
 * THE FREE ASSISTANT ENGINE: no AI service, no key, no cost per question.
 *
 * It reads a shopping question the way a shop assistant would and pulls out:
 *   car       "my creta", "thar roxx", "scorpio n" (or the car from My Garage / the screen)
 *   product   "seat cover", "dashcam", "floor mats" (English and Hinglish in Latin letters)
 *   budget    "under 8000", "below 5k", "3000 se kam", "between 3000 and 6000"
 *   order     "cheapest", "sasta", "best value", "biggest discount", "premium"
 *   question  returns, delivery, installation, payment, order status, warranty, offers, contact
 * Follow-ups reuse the last question: "cheaper ones?", "show more", "for thar instead".
 *
 * Then it searches the products it is given (search.ts ranking) and writes a short reply from fixed
 * sentences. It never invents products, prices or fitment: everything it says comes from the list.
 * The website assistant (web-local.ts) and the shop screen's fallback (store-local.ts) build on it.
 */

/* ------------------------------------------------------------------ parsing */

export type Sort = "relevance" | "price_asc" | "price_desc" | "discount";
export type Topic = "greeting" | "thanks" | "returns" | "delivery" | "installation" | "payment" | "order_status" | "warranty" | "offers" | "contact" | "bargain" | "checkout";

export type Intent = {
  car: { slug: string; name: string } | null;
  /** Product words left after taking out the car, budget and filler. */
  words: string[];
  min: number | null;
  max: number | null;
  sort: Sort;
  topic: Topic | null;
  /** "more", "others", "aur dikhao": skip what was already shown. */
  more: boolean;
  /** "cheaper", "sasta wala": below what was shown. */
  cheaper: boolean;
  /** "add", "le lunga", "this one": the customer wants the product in the order. */
  add: boolean;
};

/** Filler in English and Hinglish that says nothing about the product. */
const FILLER = new Set(
  (
    "i im i'm want need looking look find get buy give suggest recommend tell about which what is are there do does have has can could would " +
    "you your we our us it its this that these those one ones some any all also just only very really price prices cost costs rate " +
    "under below upto up to less than within max maximum budget above over more min minimum between from rs inr rupees rupee k " +
    "cheap cheaper cheapest lowest low affordable expensive costly premium top quality value discount discounts offer offers deal deals sale " +
    "mujhe muje mereko meri mera mere hamara apna chahiye chaiye chahie hai hain h kya koi kuch dikhao dikha batao bata bataiye do de dena " +
    "ke ki ka ko liye lie wala wali wale se tak kam zyada jyada sa si accha acha achha badhiya badiya sasta saste sasti mehenga mehnga aur bhi " +
    "gaadi gadi gaddi car cars vehicle model new latest please pls plz hi hello hey thanks thank ok okay yes no same instead other others another " +
    "biggest best saving savings most least highest good nice options option something thing things stuff accessories accessory parts part products product items item here shop store available stock show system add put " +
    "on of for in with at by how long take takes taking where when what why who whats does time times days much many policy policies rule rules details info information " +
    "fit fits fitting fitment compatible suit suits suitable work works go goes match"
  ).split(" "),
);

/** Hinglish and common spellings → the words the catalogue uses. */
const PRODUCT_ALIASES: Record<string, string> = {
  kavar: "cover", cover: "cover", covers: "cover", seatcover: "seat cover", seatcovers: "seat cover",
  carpet: "mat", carpets: "mat", footmat: "mat", footmats: "mat", floormat: "mat", floormats: "mat",
  camera: "cam", cameras: "cam", dashcam: "dash cam", dashcams: "dash cam", dvr: "dash cam",
  stereo: "head unit", "music": "speaker", speakers: "speaker", woofer: "subwoofer", amp: "amplifier",
  bulb: "bulb", bulbs: "bulb", seat: "seat", seats: "seat", headlight: "headlamp", headlights: "headlamp", foglight: "fog", foglights: "fog",
  perfume: "fragrance", freshener: "fragrance", mudflap: "mud flap", mudflaps: "mud flap",
  steering: "steering", tyre: "tyre", tire: "tyre", tires: "tyre", tyres: "tyre", inflator: "inflator", pump: "inflator",
  charger: "charger", chargers: "charger", holder: "holder", holders: "holder", stand: "holder", mobile: "phone",
  compressor: "inflator", lamp: "lamp", lamps: "lamp", light: "light", lights: "light", step: "step", steps: "step", rail: "rail", rails: "rail",
  mats: "mat", mat: "mat", flap: "flap", flaps: "flap", kit: "kit", kits: "kit", speaker: "speaker", cam: "cam", cams: "cam",
};

/** Words that only say which question it is (returns, delivery…), never which product. */
const TOPIC_WORDS = new Set(
  (
    "return returns refund refunds exchange replace replacement wapas vapas deliver delivery delivered shipping ship shipped dispatch courier pincode " +
    "install installation installed installing lagwa lagana lagao garage workshop mechanic warranty guarantee guaranty pay paying payment payments cod upi emi " +
    "netbanking cash order orders track tracking status aayega ayega coupon coupons promo code codes call contact human person staff agent talk baat " +
    "checkout bill billing done negotiate bargain"
  ).split(" "),
);

/** Names that are also ordinary words: count them only with the brand or after "my" / "for". */
const AMBIGUOUS = new Set(["city", "venue", "punch", "safari", "seal", "es", "nx", "elevate", "compass", "defender", "polo", "amaze", "ex", "go"]);

const CARS = ALL_MODELS.map((m) => {
  const name = norm(m.name);
  return { slug: m.slug, label: `${m.brand} ${m.name}`, brand: norm(m.brand), name, tokens: name.split(" "), compact: name.replace(/ /g, "") };
}).sort((a, b) => b.tokens.length - a.tokens.length || b.compact.length - a.compact.length);

/** The car named in the text, and the token positions it used. */
function findCar(tokens: string[]): { slug: string; name: string; used: Set<number> } | null {
  for (const c of CARS) {
    for (let i = 0; i < tokens.length; i++) {
      let used: number[] | null = null;
      if (c.tokens.every((t, k) => tokens[i + k] === t)) used = c.tokens.map((_, k) => i + k);
      else if (c.tokens.length > 1 && tokens[i] === c.compact) used = [i];
      else if (c.tokens.length === 1 && i + 1 < tokens.length && tokens[i] + tokens[i + 1] === c.compact) used = [i, i + 1];
      if (!used) continue;
      const before = tokens[i - 1];
      const brandSaid = tokens.includes(c.brand);
      if (AMBIGUOUS.has(c.compact) && !brandSaid && before !== "my" && before !== "for" && before !== "meri" && before !== "mera") continue;
      const all = new Set(used);
      tokens.forEach((t, k) => t === c.brand && all.add(k));
      return { slug: c.slug, name: c.label, used: all };
    }
  }
  return null;
}

const NUM = String.raw`(\d+(?:\.\d+)?)\s*(?:(k|thousand|hazaar|hazar|lakh|lac|l)\b)?`;
/** Lower case, "8,000" → "8000", "₹" → " rs ". Budget spans are found in, and removed from, this. */
const prep = (text: string) => text.toLowerCase().replace(/(\d),(?=\d)/g, "$1").replace(/₹/g, " rs ");
const toRupees = (n: string, unit?: string) => {
  const v = Number(n);
  if (!unit) return Math.round(v);
  if (unit === "lakh" || unit === "lac" || unit === "l") return Math.round(v * 100_000);
  return Math.round(v * 1000);
};

/** Budget in rupees from text like "under 8,000", "5k se kam", "between 3000 and 6000". */
function findBudget(text: string): { min: number | null; max: number | null; spans: string[] } {
  const t = prep(text);
  const spans: string[] = [];
  let min: number | null = null;
  let max: number | null = null;
  const between = new RegExp(String.raw`(?:between|from|rs)?\s*${NUM}\s*(?:-|to|and|se)\s*(?:rs\s*)?${NUM}`).exec(t);
  if (between && /between|from|-|\bto\b|rs/.test(between[0])) {
    const a = toRupees(between[1], between[2] ?? between[4]);
    const b = toRupees(between[3], between[4]);
    if (a >= 100 && b >= 100) return { min: Math.min(a, b), max: Math.max(a, b), spans: [between[0]] };
  }
  const under = new RegExp(String.raw`(?:under|below|upto|up to|less than|within|max(?:imum)?|budget(?: is| of)?|not more than)\s*(?:rs\.?|inr)?\s*${NUM}`).exec(t)
    ?? new RegExp(String.raw`(?:rs\.?|inr)?\s*${NUM}\s*(?:rs|rupees?)?\s*(?:se kam|tak|ke andar|or less|max|budget)`).exec(t);
  if (under) {
    max = toRupees(under[1], under[2]);
    spans.push(under[0]);
  }
  const over = new RegExp(String.raw`(?:above|over|more than|at least|minimum|min)\s*(?:rs\.?|inr)?\s*${NUM}`).exec(t)
    ?? new RegExp(String.raw`${NUM}\s*(?:rs|rupees?)?\s*se (?:upar|zyada|jyada)`).exec(t);
  if (over) {
    min = toRupees(over[1], over[2]);
    spans.push(over[0]);
  }
  if (max === null && min === null) {
    const bare = new RegExp(String.raw`(?:rs\.?|inr)\s*${NUM}|${NUM}\s*(?:rs|rupees?)\b`).exec(t);
    if (bare) {
      max = toRupees(bare[1] ?? bare[3], bare[2] ?? bare[4]);
      spans.push(bare[0]);
    }
  }
  if (max !== null && max < 100) max = null;
  if (min !== null && min < 100) min = null;
  return { min, max, spans };
}

const has = (t: string, re: RegExp) => re.test(t);

function findTopic(t: string): Topic | null {
  if (has(t, /\b(return|returns|refund|exchange|replace|replacement|wapas|vapas)\b/)) return "returns";
  if (has(t, /\b(track|tracking|order status|where is my order|(?<!to )my order|mera order|order kab|kab aayega|kab ayega)\b/)) return "order_status";
  if (has(t, /\b(deliver|delivery|shipping|ship|dispatch|courier|how long|kab tak|pincode)\b/)) return "delivery";
  if (has(t, /\b(install|installation|installed|fitting|fit kar|fix kar|lagwa|lagana|lagao|garage|workshop|mechanic)\b/)) return "installation";
  if (has(t, /\b(cod|cash on delivery|upi|emi|card|netbanking|payment|pay|paying)\b/)) return "payment";
  if (has(t, /\b(warranty|guarantee|guaranty)\b/)) return "warranty";
  if (has(t, /\b(coupon|coupons|promo|code|codes)\b/)) return "offers";
  if (has(t, /\b(call|phone|contact|human|person|staff|agent|talk to|baat)\b/)) return "contact";
  if (has(t, /\b(better price|best price|last price|final price|kam karo|kam kar|discount do|discount dedo|thoda kam|negotiate|bargain|(get|give)( me| us)?( a| some| any)? (discount|better price)|(extra|more) discount|discount (milega|mil sakta|possible)|reduce (the )?price)\b/)) return "bargain";
  if (has(t, /\b(checkout|check out|bill|billing|buy now|place order|le lunga|le lungi|lena hai|done|that's all|thats all|pay now)\b/)) return "checkout";
  if (has(t, /^(hi|hii|hello|hey|namaste|namaskar|hola|good (morning|afternoon|evening))\b/)) return "greeting";
  if (has(t, /^(thanks|thank you|thx|ok thanks|great|shukriya|dhanyavad)\b/)) return "thanks";
  return null;
}

function findSort(t: string): Sort {
  if (has(t, /\b(cheap|cheaper|cheapest|lowest|low price|affordable|budget|sasta|saste|sasti|kam price|kam daam)\b/)) return "price_asc";
  if (has(t, /\b(discount|discounts|offer|offers|deal|deals|sale|value|value for money|biggest saving|most off)\b/)) return "discount";
  if (has(t, /\b(premium|expensive|costly|top end|high end|luxury|mehenga|mehnga)\b/)) return "price_desc";
  return "relevance";
}

export function parse(text: string): Intent {
  const t = norm(text);
  const budget = findBudget(text);
  let rest = norm(budget.spans.reduce((s, sp) => s.replace(sp, " "), prep(text)));
  const tokens = rest.split(" ").filter(Boolean);
  const car = findCar(tokens);
  rest = tokens.filter((_, i) => !car?.used.has(i)).join(" ");
  const ws = words(rest)
    .flatMap((w) => (PRODUCT_ALIASES[w] ?? w).split(" "))
    .filter((w) => !FILLER.has(w) && !/^\d+$/.test(w));
  const topic = findTopic(t);
  return {
    car: car ? { slug: car.slug, name: car.name } : null,
    words: ws.filter((w) => !TOPIC_WORDS.has(w)),
    min: budget.min,
    max: budget.max,
    sort: findSort(t),
    topic,
    more: has(t, /\b(more|others|other options|aur|another|next|baaki|baki)\b/),
    cheaper: has(t, /\b(cheaper|less expensive|sasta wala|saste wale|kam wala|lower price)\b/),
    add: has(t, /^(add|yes add|put)\b|\b(add it|add this|add that|add to (my )?(order|cart)|this one|that one|ye wala|yeh wala|wo wala|le lunga|le lungi)\b/),
  };
}

/**
 * The intent with what the conversation already said: the car and the product from earlier
 * questions when this one leaves them out ("cheaper ones?", "for thar instead").
 */
export function withContext(history: AssistantMessage[], garageCar: { slug: string; name: string } | null): { intent: Intent; shown: string[] } {
  const users = history.filter((m) => m.role === "user");
  const intent = parse(users[users.length - 1]?.content ?? "");
  const earlier = users.slice(0, -1).reverse().map((m) => parse(m.content));
  if (!intent.car) intent.car = earlier.find((e) => e.car)?.car ?? garageCar;
  const lastProduct = earlier.find((e) => e.words.length > 0);
  if (intent.words.length === 0 && lastProduct && !isPureTopic(intent)) {
    intent.words = lastProduct.words;
    if (intent.max === null && intent.min === null && !intent.cheaper) {
      intent.min = lastProduct.min;
      intent.max = lastProduct.max;
    }
    if (intent.sort === "relevance") intent.sort = lastProduct.sort;
  }
  // "Show more" skips everything shown so far; "cheaper" compares with the last answer.
  const lastReply = [...history].reverse().find((m) => m.role === "assistant");
  const everShown = history.flatMap((m) => (m.role === "assistant" ? (m.products ?? []) : []));
  return { intent, shown: intent.more ? everShown : (lastReply?.products ?? []) };
}

/** A question that is only about returns, delivery and the like (no product asked for). */
const isPureTopic = (i: Intent) => i.topic !== null && i.topic !== "offers" && i.topic !== "bargain" && i.topic !== "checkout" && i.words.length === 0;

/* ------------------------------------------------------------------ search */

export type Candidate = {
  id: string;
  title: string;
  brand: string;
  category: string;
  extra: string;
  fitment: string[];
  price: number | null;
  mrp: number | null;
  buyable: boolean;
};

export type Found<T> = { items: T[]; note: string | null };

/** One spelling per idea, on both sides (the question and the product text): "cameras" → "cam". */
const CANON: Record<string, string[]> = {
  dashcam: ["dash", "cam"], dashcams: ["dash", "cam"], camera: ["cam"], cameras: ["cam"], cams: ["cam"],
  footmat: ["foot", "mat"], footmats: ["foot", "mat"], floormat: ["floor", "mat"], floormats: ["floor", "mat"],
  seatcover: ["seat", "cover"], seatcovers: ["seat", "cover"],
  freshener: ["fragrance"], perfume: ["fragrance"], fragrances: ["fragrance"],
  compressor: ["inflator"], compressors: ["inflator"], inflators: ["inflator"], mobile: ["phone"],
  headlight: ["headlamp"], headlights: ["headlamp"], headlamps: ["headlamp"], tire: ["tyre"], tires: ["tyre"],
  boxes: ["box"], organizer: ["organiser"], organizers: ["organiser"], organisers: ["organiser"],
};
const ADD_ON = new Set(["wire", "cable", "harness", "hardwire", "mount", "adapter", "adaptor", "bracket", "converter", "fuse", "relay", "tool", "spool", "connector"]);
const canon = (w: string): string[] => CANON[w] ?? [w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w];
const tokensOf = (text: string) => norm(text).split(" ").filter(Boolean).flatMap(canon);

/**
 * How well a product matches the words: every word must appear (as a whole word) in its title,
 * category, brand or keywords. Title counts most; the words together as a phrase, or all in the
 * category ("Seat Covers"), count extra. 0 = not a match.
 */
function match(c: Candidate, ws: string[]): number {
  if (ws.length === 0) return 1;
  const q = ws.flatMap(canon);
  const fields = [
    { t: tokensOf(c.title), w: 4 },
    { t: tokensOf(c.category), w: 3 },
    { t: tokensOf(c.brand), w: 2 },
    { t: tokensOf(c.extra), w: 1 },
  ];
  let s = 0;
  for (const w of q) {
    const best = Math.max(0, ...fields.filter((f) => f.t.includes(w)).map((f) => f.w));
    if (best === 0) return 0;
    s += best;
  }
  if (q.length > 1) {
    const phrase = q.join(" ");
    if (` ${fields[0].t.join(" ")} `.includes(` ${phrase} `)) s += 4;
    if (` ${fields[1].t.join(" ")} `.includes(` ${phrase} `)) s += 3;
  }
  if (q.every((w) => fields[1].t.includes(w))) s += 3;
  // A fitting kit or cable for the thing asked for ranks below the thing itself.
  if (fields[0].t.some((t) => ADD_ON.has(t)) && !q.some((w) => ADD_ON.has(w))) s = Math.max(1, s - 4);
  return s;
}

/**
 * Searches with the intent. When nothing matches it loosens one thing at a time (budget, then car)
 * and says what it changed, so the customer always gets the closest real products.
 */
export function search<T extends Candidate>(all: T[], intent: Intent, shown: string[], limit: number): Found<T> {
  const ws = intent.words.slice(0, 8);
  const shownPrices = all.filter((c) => shown.includes(c.id) && c.price !== null).map((c) => c.price as number);
  let max = intent.max;
  if (intent.cheaper && shownPrices.length) max = Math.min(...shownPrices) - 1;
  const skip = intent.more || intent.cheaper ? new Set(shown) : new Set<string>();
  const sort = intent.cheaper ? "price_asc" : intent.sort;

  const run = (opts: { car: string | null; min: number | null; max: number | null }) => {
    const ranked = all
      .map((c) => ({ c, s: match(c, ws) }))
      .filter(({ c, s }) => s > 0 && !skip.has(c.id))
      .filter(({ c }) => (opts.max === null || (c.price !== null && c.price <= opts.max)) && (opts.min === null || (c.price !== null && c.price >= opts.min)))
      .filter(({ c }) => fits(c.fitment, opts.car) !== false);
    const exact = (c: T) => (opts.car && c.fitment.includes(opts.car) ? 1 : 0);
    const off = (c: T) => (c.mrp && c.price && c.mrp > c.price ? (c.mrp - c.price) / c.mrp : 0);
    ranked.sort(
      (a, b) =>
        Number(b.c.buyable) - Number(a.c.buyable) ||
        (sort === "price_asc" ? (a.c.price ?? Infinity) - (b.c.price ?? Infinity)
          : sort === "price_desc" ? (b.c.price ?? 0) - (a.c.price ?? 0)
          : sort === "discount" ? off(b.c) - off(a.c)
          : 0) ||
        b.s + exact(b.c) * 3 - (a.s + exact(a.c) * 3),
    );
    return ranked.slice(0, limit).map(({ c }) => c);
  };

  const car = intent.car?.slug ?? null;
  let items = run({ car, min: intent.min, max });
  if (items.length) return { items, note: null };
  if (max !== null || intent.min !== null) {
    items = run({ car, min: null, max: null });
    if (items.length) {
      const range = budgetWords(intent.min, max);
      return { items: sortBy(items, "price_asc"), note: `Nothing ${range}, so here are the closest${car ? " that fit" : ""}, lowest price first.` };
    }
  }
  if (car) {
    items = run({ car: null, min: intent.min, max });
    if (items.length) return { items, note: `I couldn't find these listed for the ${intent.car!.name}. These are close; check the fitment on the product page.` };
  }
  return { items: [], note: null };
}

const sortBy = <T extends Candidate>(items: T[], s: Sort) => (s === "price_asc" ? [...items].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)) : items);

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function budgetWords(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `between ${inr(min)} and ${inr(max)}`;
  if (max !== null) return `under ${inr(max)}`;
  if (min !== null) return `above ${inr(min)}`;
  return "";
}

/** "seat covers that fit your Hyundai Creta under ₹8,000, cheapest first" */
export function describe(intent: Intent, count: number, what: string): string {
  const parts = [what];
  if (intent.car) parts.push(`for your ${intent.car.name}`);
  const range = budgetWords(intent.min, intent.cheaper ? null : intent.max);
  if (range) parts.push(range);
  const order = intent.cheaper || intent.sort === "price_asc" ? ", lowest price first" : intent.sort === "discount" ? ", biggest saving first" : intent.sort === "price_desc" ? ", top end first" : "";
  return `${count === 1 ? "Here's one option" : `Here are ${count} options`}: ${parts.join(" ")}${order}.`;
}

/** The words the customer asked for, for the reply ("seat cover", "dash cam"). */
export function askedFor(intent: Intent): string {
  if (!intent.words.length) return "products";
  const ws = intent.words.map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w));
  const lastW = ws[ws.length - 1];
  if (!/(s|ing|ion|ware|gear|kit)$/i.test(lastW) && !ACRONYMS.has(lastW.toLowerCase())) ws[ws.length - 1] = `${lastW}s`;
  return ws.join(" ");
}
const ACRONYMS = new Set(["led", "drl", "drls", "7d", "9d", "5d", "tpe", "pu", "usb", "gps", "dsp", "4x4", "oem", "ppf", "hid", "suv"]);

/** Detects text with no Latin letters at all (Devanagari and other scripts aren't understood yet). */
export const noLatin = (text: string) => !/[a-z]/i.test(text) && /\p{L}/u.test(text);

export const modelName = (slug: string | null) => (slug ? modelLabel(slug) : null);
