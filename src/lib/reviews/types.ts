/** A customer review as the site shows it (approved only). Client-safe. */
export type PublicReview = {
  id: string;
  name: string;
  city: string | null;
  vehicle: string | null;
  /** What was reviewed: the product's name, or "Riderzpro order". */
  about: string;
  productSlug: string | null;
  /** The reviewed product's department (interior, multimedia…), null for a whole-order review. */
  department: string | null;
  rating: number;
  title: string | null;
  body: string;
  /** "March 2026". */
  date: string;
};
