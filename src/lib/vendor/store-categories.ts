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
};

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
