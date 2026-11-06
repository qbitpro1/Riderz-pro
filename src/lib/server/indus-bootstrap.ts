import "server-only";

import { sql, sqlOne } from "@/lib/db/client";
import { seedDemoStore, DEMO_SLUG } from "./demo-store";
import { newToken } from "./security";
import { ensureStarterCategories } from "./starter-categories";
import { audit, type Actor } from "./vendors";

/**
 * Sets up the Indus Enterprises Offline Store by itself when the site starts, so the team sees it on
 * the website right after a deploy without anyone signing up or approving it.
 *
 * - Runs only when there is no Indus Enterprises seller yet. An existing one (made in /admin/vendors
 *   or by an earlier start) is never changed, apart from getting its shop categories if it has none.
 * - Creates the same store as the local one: approved, starter products with photos, the 14 shop
 *   categories (Car Cover tagged Bestseller), and the shop-screen details below.
 * - The login password is not in this public repo: only its scrypt hash is. The owner has the
 *   password. Change it from the seller portal at any time.
 * - Set SEED_INDUS_STORE=off on the server to switch this off.
 */

const EMAIL = "indus@riderzpro.com";
const MOBILE = "9811122233";
const PASSWORD_HASH = "scrypt$16384$8$1$ZhRmnqeBvfqPbgCWqWq82Q==$7x0MR+KFjj25sUuqC1gjO/wVAzetYPRxgISBHcWGW3y+tE8iwoBtCIqe200WGA7lkYSyphVyVlkHPxZ+pGn/Sw==";

const SCREEN = {
  address: "Autoform Store, Lajpat Nagar, Delhi",
  offer: "Free fitting on all seat covers this week",
  aiEnabled: true,
  bargainEnabled: true,
  maxDiscountPct: 10,
};

const SYSTEM: Actor = { type: "system", id: "startup" };

export async function ensureIndusStore(): Promise<void> {
  if (process.env.SEED_INDUS_STORE === "off") return;

  const existing = await sqlOne<{ id: string }>("SELECT id FROM vendors WHERE slug = $1", [DEMO_SLUG]);
  if (existing) {
    await ensureStarterCategories(existing.id, SYSTEM);
    const demoRows = await sql<{ id: string; images: string[] }>(
      "SELECT id, images FROM vendor_products WHERE vendor_id = $1 AND sku LIKE 'DEMO-%'",
      [existing.id],
    );
    for (const r of demoRows) {
      await sql("DELETE FROM vendor_products WHERE id = $1", [r.id]);
      if (r.images?.length) await sql("DELETE FROM files WHERE vendor_id = $1 AND id = ANY($2)", [existing.id, r.images]);
    }
    return;
  }
  // Someone else already uses this login: leave everything as it is.
  const clash = await sqlOne("SELECT 1 FROM vendors WHERE lower(email) = $1 OR mobile = $2", [EMAIL, MOBILE]);
  if (clash) {
    console.warn("[indus] not set up: its email or mobile belongs to another seller");
    return;
  }

  // The store, products, photos and categories; then the real password (by its hash) and screen details.
  const made = await seedDemoStore({ email: EMAIL, mobile: MOBILE, password: newToken() }, SYSTEM, "startup");
  await sql("UPDATE vendors SET password_hash = $2, updated_at = now() WHERE id = $1", [made.vendorId, PASSWORD_HASH]);
  await sql(
    `INSERT INTO store_settings (vendor_id, ai_enabled, bargain_enabled, max_discount_pct, pay_on_screen, pay_at_counter, screen_address, screen_offer)
     VALUES ($1, $2, $3, $4, true, true, $5, $6)
     ON CONFLICT (vendor_id) DO NOTHING`,
    [made.vendorId, SCREEN.aiEnabled, SCREEN.bargainEnabled, SCREEN.maxDiscountPct, SCREEN.address, SCREEN.offer],
  );
  await audit(SYSTEM, "indus.bootstrap", { vendorId: made.vendorId, detail: { products: made.products, photos: made.photos } });
  console.info(`[indus] Indus Enterprises set up: ${made.products} products, ${made.photos} photos`);
}
