/**
 * STORE SLUGS
 *
 * The one place a product's store slug (`/products/{slug}`) is built from its
 * source catalogue's own fields. Deliberately data-free — it imports no
 * catalogue — so the catalogue adapters, the server-side detail layer and
 * client components can all share it without an import cycle.
 */

export const storeSlug = {
  house: (p: { slug: string }) => p.slug,
  recoil: (p: { slug: string }) => p.slug,
  autoformDesign: (d: { slug: string }) => `autoform-${d.slug}`,
  autoformMat: (m: { sno: number }) => `autoform-mat-${m.sno}`,
  autoformAccessory: (a: { sno: number }) => `autoform-accessory-${a.sno}`,
  // Blaupunkt's own slugs already begin "blaupunkt-"; prefixing again would give
  // "blaupunkt-blaupunkt-…", so the prefix is added only where it is missing.
  blaupunkt: (p: { slug: string }) => (p.slug.startsWith("blaupunkt-") ? p.slug : `blaupunkt-${p.slug}`),
};
