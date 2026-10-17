/** Shapes the offline store screen receives from the server. Public product fields only. */

export type ScreenStore = {
  name: string;
  slug: string;
  /** Logo file id (use `fileHref`). */
  logo: string | null;
  city: string | null;
};

export type ScreenProduct = {
  id: string;
  title: string;
  brand: string;
  department: string;
  group: string;
  groupName: string;
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
