/**
 * A seller's own shop categories for the Offline Store screen: top-level categories
 * ("Mats") and sub-categories one level inside them ("Autoform", "GFX Pro").
 * Client-safe: types and small helpers only.
 */

export type StoreCategory = {
  id: string;
  name: string;
  /** null = a top-level category. */
  parentId: string | null;
  position: number;
  /** Products (any status except archived) filed directly under this category. */
  products: number;
  /** Shows a "Bestseller" tag on the screen for every product in it. */
  bestseller: boolean;
  /** Main categories to suggest after a customer adds a product from this one (empty = automatic). */
  suggestIds: string[];
};

export const STORE_SUGGEST_MAX = 6;

/**
 * Automatic "goes well with" pairs between shop category names, used when the seller hasn't
 * chosen any for a category. Each rule: a category name pattern → names it pairs with.
 */
const AUTO_PAIRS: [RegExp, RegExp[]][] = [
  [/car ?cover|body ?cover/, [/mat/, /car ?care|clean|polish/, /guard|protect/]],
  [/seat/, [/mat/, /steering/, /cushion|ortho|comfort/]],
  [/mat/, [/seat/, /car ?care|clean/, /car ?cover/]],
  [/steering/, [/seat/, /mat/]],
  [/cushion|ortho|comfort/, [/seat/, /steering/]],
  [/speaker|sub ?woofer|amp/, [/stereo|head ?unit|display/, /speaker|sub ?woofer|amp/]],
  [/stereo|head ?unit|display|android/, [/speaker/, /dash ?cam|camera/]],
  [/dash ?cam|camera/, [/stereo|display/, /light|lamp/]],
  [/fog/, [/head ?lamp/, /light/]],
  [/head ?lamp/, [/fog/, /light/]],
  [/light|led|bulb/, [/fog/, /head ?lamp/]],
  [/guard|protect/, [/car ?cover/, /window|film/]],
  [/window|film/, [/guard|protect/, /car ?care/]],
  [/car ?care|clean|polish|wash/, [/mat/, /car ?cover/]],
];

/** The main categories to suggest alongside `cat`: the seller's own choice, else the automatic pairs. */
export function suggestedCategoryIds(cat: { id: string; name: string; suggestIds: string[] }, mains: { id: string; name: string }[]): string[] {
  const valid = new Set(mains.map((m) => m.id));
  const own = cat.suggestIds.filter((id) => id !== cat.id && valid.has(id));
  if (own.length) return own;
  const name = cat.name.toLowerCase();
  const rule = AUTO_PAIRS.find(([re]) => re.test(name));
  if (!rule) return [];
  const out: string[] = [];
  for (const want of rule[1]) {
    for (const m of mains) if (m.id !== cat.id && want.test(m.name.toLowerCase()) && !out.includes(m.id)) out.push(m.id);
  }
  return out.slice(0, STORE_SUGGEST_MAX);
}

/** A top-level category with its sub-categories, both in display order. */
export type StoreCategoryTree = StoreCategory & { subs: StoreCategory[] };

export const STORE_CATEGORY_NAME_MAX = 40;
export const STORE_CATEGORIES_MAX = 60;

export function categoryTree(list: StoreCategory[]): StoreCategoryTree[] {
  const order = (a: StoreCategory, b: StoreCategory) => a.position - b.position || a.name.localeCompare(b.name);
  return list
    .filter((c) => !c.parentId)
    .sort(order)
    .map((c) => ({ ...c, subs: list.filter((s) => s.parentId === c.id).sort(order) }));
}
