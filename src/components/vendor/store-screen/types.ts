/** Shapes the offline store screen receives from the server. Public product fields only. */

export type ScreenStore = {
  name: string;
  slug: string;
  /** Logo file id (use `fileHref`). */
  logo: string | null;
  city: string | null;
  /** Under the shop name: the seller's own line ("Autoform Store, Lajpat Nagar, Delhi") or the pickup address. */
  address: string | null;
  /** Opening hours for the welcome screen (the seller's own, or SCREEN_HOURS_DEFAULT). */
  hours: string;
  /** Today's offer for the welcome screen; null = none. */
  offer: string | null;
};

/** The hours the welcome screen shows when the seller hasn't set their own. */
export const SCREEN_HOURS_DEFAULT = "Open all days, 10 am – 8 pm";

export type ScreenProduct = {
  id: string;
  title: string;
  brand: string;
  department: string;
  /** The seller's shop category id, or (when it has none) its marketplace group slug. */
  group: string;
  groupName: string;
  /** Display order of the group: shop categories in the seller's order, then the rest. */
  groupPos: number;
  /** The shop sub-category inside `group` ("GFX Pro" in Mats), if any. */
  sub: string | null;
  subName: string | null;
  subPos: number;
  /** The marketplace group name ("Cameras"), kept for search when a shop category renames it. */
  typeName: string;
  mrp: number;
  price: number;
  stock: number;
  /** "OEM (Original Equipment)", "Genuine brand part" or "Aftermarket". */
  partType: string;
  /** True when the product fits every vehicle. */
  universal: boolean;
  /** Vehicle model slugs this product is listed for (never "universal"). */
  fitSlugs: string[];
  /** The same models in words, "Mahindra BE 6". */
  fitLabels: string[];
  warrantyMonths: number | null;
  summary: string | null;
  highlights: string[];
  specs: { label: string; value: string }[];
  /** Image file ids, in display order. */
  images: string[];
};

/** One car model in the "Find for my car" picker. `n` = products listed for this exact model. */
export type ScreenFitModel = { slug: string; name: string; n: number };
export type ScreenFitBrand = { slug: string; name: string; n: number; models: ScreenFitModel[] };
