import "server-only";

import { z } from "zod";
import { sql, sqlOne } from "@/lib/db/client";
import { DEFAULT_COMMISSION_RATE, type VendorOnboarding } from "@/lib/vendor/types";
import { emailSchema, mobileSchema } from "@/lib/vendor/validators";
import { ensureStarterCategories } from "./starter-categories";
import { ApiError } from "./http";
import { hashPassword, newId } from "./security";
import { audit, type Actor } from "./vendors";

/**
 * THE DEMO STORE — "Indus Enterprises"
 *
 * An approved seller with its shop categories and no products, so the offline store screen can
 * be shown without a real seller; its products are added like any seller's (by hand or with the
 * JSON upload). Run from /admin/vendors (admin only). Safe to run again: it removes any old demo
 * products (SKUs starting DEMO-) and leaves everything else the seller added alone.
 *
 * An existing "Asha Accessories" demo store (slug asha-accessories) is renamed to
 * Indus Enterprises rather than duplicated.
 *
 * Only public catalogue fields are copied (title, brand, price, MRP, photos, highlights,
 * specs). Dealer prices never leave src/lib/catalog.
 */

export const DEMO_NAME = "Indus Enterprises";
export const DEMO_SLUG = "indus-enterprises";
const OLD_SLUGS = ["asha-accessories"];
const SKU_PREFIX = "DEMO-";

export const demoStoreSchema = z.object({
  /** Needed only when the demo seller does not exist yet. */
  email: emailSchema.optional(),
  mobile: mobileSchema.optional(),
  /**
   * The demo seller's password. Shorter than real sellers' (passwordSchema) on purpose, so a
   * demo login is easy to type at a stand; only an admin can set it, from /admin/vendors.
   */
  password: z.string().min(5, "Use at least 5 characters").max(128).optional(),
});

const ONBOARDING: VendorOnboarding = {
  store: {
    storeName: DEMO_NAME,
    slug: DEMO_SLUG,
    sellerType: "Retailer",
    description: "Demo store for the offline store screen.",
    departments: ["interior", "multimedia"],
    brands: [{ name: "Various", authType: "Authorised" }],
    logoFileId: null,
    bannerFileId: null,
  },
  shipping: {
    pickup: { line1: "Demo address", line2: null, city: "Delhi", state: "Delhi", pincode: "110001" },
    contactPhone: "9000000000",
    handlingDays: 2,
    shipsTo: "pan_india",
    acceptsReturns: true,
    returnWindowDays: 7,
  },
};

export type DemoStoreResult = { vendorId: string; slug: string; action: "created" | "renamed" | "refreshed"; products: number; photos: number };

export async function seedDemoStore(input: z.infer<typeof demoStoreSchema>, by: Actor, ip: string): Promise<DemoStoreResult> {
  let vendor = await sqlOne<{ id: string; slug: string | null; onboarding: VendorOnboarding | null }>(
    "SELECT id, slug, onboarding FROM vendors WHERE slug = ANY($1) ORDER BY (slug = $2) DESC LIMIT 1",
    [[DEMO_SLUG, ...OLD_SLUGS], DEMO_SLUG],
  );
  let action: DemoStoreResult["action"];

  if (vendor) {
    action = vendor.slug === DEMO_SLUG ? "refreshed" : "renamed";
    const onboarding: VendorOnboarding = {
      ...ONBOARDING,
      ...(vendor.onboarding ?? {}),
      store: { ...ONBOARDING.store!, ...(vendor.onboarding?.store ?? {}), storeName: DEMO_NAME, slug: DEMO_SLUG },
    };
    await sql(
      `UPDATE vendors SET store_name = $2, slug = $3, onboarding = $4::jsonb, status = 'approved',
              commission_rate = COALESCE(commission_rate, $5), tier = COALESCE(tier, 'standard'),
              approved_at = COALESCE(approved_at, now()), approved_by = COALESCE(approved_by, $6),
              changes_requested = NULL, rejection_reason = NULL, updated_at = now()
        WHERE id = $1`,
      [vendor.id, DEMO_NAME, DEMO_SLUG, JSON.stringify(onboarding), DEFAULT_COMMISSION_RATE, by.id],
    );
    if (input.email) {
      const clash = await sqlOne("SELECT 1 FROM vendors WHERE lower(email) = $1 AND id <> $2", [input.email, vendor.id]);
      if (clash) throw new ApiError(409, "exists", "Another seller already uses this email.", { email: "Another seller already uses this email" });
      await sql("UPDATE vendors SET email = $2, email_verified_at = now(), updated_at = now() WHERE id = $1", [vendor.id, input.email]);
    }
    if (input.mobile) {
      const clash = await sqlOne("SELECT 1 FROM vendors WHERE mobile = $1 AND id <> $2", [input.mobile, vendor.id]);
      if (clash) throw new ApiError(409, "exists", "Another seller already uses this mobile.", { mobile: "Another seller already uses this mobile" });
      await sql("UPDATE vendors SET mobile = $2, mobile_verified_at = now(), updated_at = now() WHERE id = $1", [vendor.id, input.mobile]);
    }
    if (input.password) {
      await sql("UPDATE vendors SET password_hash = $2, updated_at = now() WHERE id = $1", [vendor.id, await hashPassword(input.password)]);
    }
  } else {
    if (!input.email || !input.mobile || !input.password) {
      throw new ApiError(400, "invalid", "The demo seller does not exist yet: give an email, mobile and password for its login.", {
        ...(input.email ? {} : { email: "Required to create the demo seller" }),
        ...(input.mobile ? {} : { mobile: "Required to create the demo seller" }),
        ...(input.password ? {} : { password: "Required to create the demo seller" }),
      });
    }
    const clash = await sqlOne("SELECT 1 FROM vendors WHERE lower(email) = $1 OR mobile = $2", [input.email, input.mobile]);
    if (clash) throw new ApiError(409, "exists", "A seller with this email or mobile already exists.");
    const id = newId("ven");
    await sql(
      `INSERT INTO vendors (id, email, mobile, password_hash, full_name, business_type, status, email_verified_at, mobile_verified_at,
                            store_name, slug, onboarding, current_step, completed_steps, commission_rate, tier,
                            submitted_at, approved_at, approved_by)
       VALUES ($1, $2, $3, $4, $5, 'Proprietorship', 'approved', now(), now(), $6, $7, $8::jsonb, 6, '{1,2,3,4,5,6}',
               $9, 'standard', now(), now(), $10)`,
      [id, input.email, input.mobile, await hashPassword(input.password), `${DEMO_NAME} (demo)`, DEMO_NAME, DEMO_SLUG,
        JSON.stringify(ONBOARDING), DEFAULT_COMMISSION_RATE, by.id],
    );
    vendor = { id, slug: DEMO_SLUG, onboarding: ONBOARDING };
    action = "created";
  }

  // Old demo products (SKUs starting DEMO-) go, with their photos. The seller's own products are never touched.
  const existing = await sql<{ id: string; images: string[] }>("SELECT id, images FROM vendor_products WHERE vendor_id = $1 AND sku LIKE $2", [
    vendor.id,
    `${SKU_PREFIX}%`,
  ]);
  const products = 0;
  const photos = 0;
  for (const row of existing) {
    await sql("DELETE FROM vendor_products WHERE id = $1", [row.id]);
    if (row.images?.length) await sql("DELETE FROM files WHERE vendor_id = $1 AND id = ANY($2)", [vendor.id, row.images]);
  }

  // Its shop categories (Seat Cover, Mats › Autoform / GFX Pro, … Car Cover) if it has none yet.
  await ensureStarterCategories(vendor.id, by);
  await audit(by, "demo_store.seed", { vendorId: vendor.id, ip, detail: { action, products, photos } });
  return { vendorId: vendor.id, slug: DEMO_SLUG, action, products, photos };
}
