/**
 * Browser-storage keys renamed in the Motorbotz → Riderzpro rebrand. The first
 * read of a renamed key moves the visitor's saved value across, so nobody loses
 * a cart, a chosen car or a compare list to the rename.
 */
const RENAMED: Record<string, string> = {
  "riderzpro.cart.v1": "motorbotz.cart.v1",
  "riderzpro.garage.v1": "motorbotz.garage.v1",
  "riderzpro.compare.v1": "motorbotz.compare.v1",
  "rp:be6-build": "mb:be6-build",
};

/** `localStorage.getItem`, falling back to — and migrating — the pre-rebrand key. Throws as `getItem` does. */
export function readStored(key: string): string | null {
  const value = localStorage.getItem(key);
  const legacy = RENAMED[key];
  if (value !== null || !legacy) return value;
  const old = localStorage.getItem(legacy);
  if (old !== null) {
    localStorage.setItem(key, old);
    localStorage.removeItem(legacy);
  }
  return old;
}
