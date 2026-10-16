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
  warrantyMonths: number | null;
  summary: string | null;
  highlights: string[];
  specs: { label: string; value: string }[];
  /** Image file ids, in display order. */
  images: string[];
};
