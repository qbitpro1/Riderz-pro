import "server-only";

import { sql, type Query } from "@/lib/db/client";
import { newId } from "./security";
import { audit, type Actor } from "./vendors";

/**
 * Starter shop categories for sellers the owner set up by hand (today: Indus Enterprises).
 *
 * Migrations 016/017 created these only for a seller that already existed when the database was
 * upgraded. On a new database the seller signs up (or is set up) later, so the same categories are
 * made here when the seller is approved or set up from /admin/vendors.
 *
 * Runs only for a seller with no shop categories at all, so once the seller has any, their own
 * names, order and choices are never touched.
 */

type Starter = { name: string; bestseller?: boolean; subs?: string[] };

const INDUS: Starter[] = [
  { name: "Seat Cover" },
  { name: "Mats", subs: ["Autoform", "GFX Pro"] },
  { name: "Speaker" },
  { name: "Stereo" },
  { name: "Dashcam" },
  { name: "Orthopedic Cushion" },
  { name: "Fog Lamp" },
  { name: "Head Lamp" },
  { name: "Lights" },
  { name: "Steering Cover" },
  { name: "Protection Guard" },
  { name: "Window Film" },
  { name: "Car Care" },
  { name: "Car Cover", bestseller: true },
];

/** Marketplace group → starter category, for filing the seller's products (as in migration 017). */
const BY_GROUP: Record<string, string> = {
  "seat-covers": "Seat Cover",
  "floor-mats": "Mats",
  speakers: "Speaker",
  subwoofers: "Speaker",
  amplifiers: "Speaker",
  displays: "Stereo",
  cameras: "Dashcam",
  comfort: "Orthopedic Cushion",
  "fog-drl": "Fog Lamp",
  headlamps: "Head Lamp",
  "led-bulbs": "Lights",
  "ambient-lighting": "Lights",
  auxiliary: "Lights",
  "steering-covers": "Steering Cover",
  "car-care": "Car Care",
  armour: "Protection Guard",
  exterior: "Protection Guard",
};

/** The starter set for this seller, or null if it has none. Matched by web address or shop name. */
function starterFor(v: { slug: string | null; store_name: string | null }): Starter[] | null {
  const name = (v.store_name ?? "").trim().toLowerCase();
  if (v.slug === "indus-enterprises" || name.startsWith("indus enterprises")) return INDUS;
  return null;
}

/**
 * Gives the seller its starter shop categories if it has a starter set and no categories yet, and
 * files its products that have no shop category. Returns how many categories were made (0 = none).
 */
export async function ensureStarterCategories(vendorId: string, by: Actor, q: Query = sql): Promise<number> {
  const [v] = await q<{ slug: string | null; store_name: string | null; n: number }>(
    `SELECT v.slug, v.store_name, (SELECT count(*)::int FROM store_categories c WHERE c.vendor_id = v.id) AS n
       FROM vendors v WHERE v.id = $1`,
    [vendorId],
  );
  const set = v && v.n === 0 ? starterFor(v) : null;
  if (!set) return 0;

  const ids = new Map<string, string>();
  let made = 0;
  for (const [i, c] of set.entries()) {
    const id = newId("sc");
    ids.set(c.name, id);
    await q("INSERT INTO store_categories (id, vendor_id, parent_id, name, position, bestseller) VALUES ($1, $2, NULL, $3, $4, $5)", [
      id,
      vendorId,
      c.name,
      i + 1,
      Boolean(c.bestseller),
    ]);
    made++;
    for (const [j, s] of (c.subs ?? []).entries()) {
      const subId = newId("sc");
      ids.set(`${c.name}/${s}`, subId);
      await q("INSERT INTO store_categories (id, vendor_id, parent_id, name, position) VALUES ($1, $2, $3, $4, $5)", [subId, vendorId, id, s, j + 1]);
      made++;
    }
  }

  // File products that have no shop category yet.
  const products = await q<{ id: string; group_slug: string; department: string; title: string; brand: string }>(
    "SELECT id, group_slug, department, title, brand FROM vendor_products WHERE vendor_id = $1 AND store_category_id IS NULL",
    [vendorId],
  );
  for (const p of products) {
    let target = BY_GROUP[p.group_slug];
    if (p.group_slug === "exterior" && p.department === "covers-guards" && /car cover/i.test(p.title)) target = "Car Cover";
    if (target === "Mats") {
      const brand = p.brand.trim().toLowerCase();
      if (brand.startsWith("gfx")) target = "Mats/GFX Pro";
      else if (brand.startsWith("autoform")) target = "Mats/Autoform";
    }
    const id = target ? ids.get(target) : undefined;
    if (id) await q("UPDATE vendor_products SET store_category_id = $2 WHERE id = $1", [p.id, id]);
  }

  await audit(by, "store_category.starter", { vendorId, detail: { categories: made } }, q);
  return made;
}
