import type { MediaKey } from "@/lib/media";
import { DEPARTMENTS, placeSub, type DepartmentSlug } from "@/lib/data/taxonomy";

/**
 * The shop's categories ARE the eight departments in `taxonomy.ts`. These
 * names are kept so existing callers keep working; nothing here decides what a
 * department is — the taxonomy does.
 */
export type CategorySlug = DepartmentSlug;

export type PriceTier = "value" | "mid" | "premium";

export type Category = {
  slug: CategorySlug;
  name: string;
  tagline: string;
  blurb: string;
  image: MediaKey;
  /** Every catalogue `sub` label the department shelves, across its groups. */
  subcategories: string[];
};

export const CATEGORIES: Category[] = DEPARTMENTS.map((d) => ({
  slug: d.slug,
  name: d.name,
  tagline: d.tagline,
  blurb: d.blurb,
  image: d.image,
  subcategories: d.groups.flatMap((g) => g.subs),
}));

export type Product = {
  slug: string;
  name: string;
  maker: string;
  category: CategorySlug;
  sub: string;
  price: number;
  mrp: number;
  rating: number | null;
  reviews: number | null;
  stock: number;
  tier: PriceTier;
  /** Model slugs from the vehicle catalogue, or ["universal"]. */
  fitment: string[];
  installation: boolean;
  installPrice?: number;
  installTime?: string;
  warranty: string;
  delivery: string;
  image: MediaKey;
  gallery?: MediaKey[];
  hasVideo?: boolean;
  summary: string;
  features: string[];
  specs: { label: string; value: string }[];
  bestseller?: boolean;
};

const HOUSE_PRODUCTS: (Omit<Product, "category"> & { category: string })[] = [];

/** The department is always derived from `sub`, never from the hand-written `category` above. */
export const PRODUCTS: Product[] = HOUSE_PRODUCTS.map((p) => ({ ...p, category: placeSub(p.sub).department }));

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function productsIn(category: CategorySlug): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function fitsModel(product: Product, modelSlug: string): boolean {
  return product.fitment.includes("universal") || product.fitment.includes(modelSlug);
}

export function productsForModel(modelSlug: string): Product[] {
  return PRODUCTS.filter((p) => fitsModel(p, modelSlug));
}

export function relatedProducts(product: Product, limit = 4): Product[] {
  return PRODUCTS.filter((p) => p.slug !== product.slug)
    .sort((a, b) => {
      const score = (p: Product) =>
        (p.category === product.category ? 3 : 0) + (p.tier === product.tier ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, limit);
}

export const BESTSELLERS = PRODUCTS.filter((p) => p.bestseller);

export const PRICE_BANDS = [
  {
    slug: "value",
    label: "Value",
    range: "₹299 – ₹4,999",
    blurb: "Mats, covers, curtains, organisers, LED bulbs. The stuff every car needs on day one.",
  },
  {
    slug: "mid",
    label: "Mid-Range",
    range: "₹5,000 – ₹25,000",
    blurb: "Audio, lighting, screens, interior trim, roof carriers. Where most builds start.",
  },
  {
    slug: "premium",
    label: "Premium",
    range: "₹25,000 – ₹2,00,000",
    blurb: "DSP audio, PPF, body kits, off-road hardware, performance work.",
  },
  {
    slug: "signature",
    label: "Signature Builds",
    range: "₹2,00,000 +",
    blurb: "Complete vehicle transformations, built to a brief over four to twelve weeks.",
  },
] as const;
