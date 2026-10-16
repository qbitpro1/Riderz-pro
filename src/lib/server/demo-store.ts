import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { sql, sqlOne } from "@/lib/db/client";
import { PRODUCT_DETAILS } from "@/lib/store/products";
import type { ProductDetail } from "@/lib/store/types";
import { DEFAULT_COMMISSION_RATE, type VendorOnboarding } from "@/lib/vendor/types";
import { emailSchema, mobileSchema, passwordSchema } from "@/lib/vendor/validators";
import { saveFile } from "./files";
import { ApiError } from "./http";
import { hashPassword, newId } from "./security";
import { newSlug } from "./vendor-catalogue";
import { audit, type Actor } from "./vendors";

/**
 * THE DEMO STORE — "Indus Enterprises"
 *
 * An approved seller with seat covers and speakers copied from the house catalogue,
 * so the offline store screen can be shown without a real seller. Run from
 * /admin/vendors (admin only). Safe to run again: it refreshes the demo products
 * (SKUs starting DEMO-) and leaves anything else the seller added alone.
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
const PER_GROUP = 6;
const IMAGES_PER_PRODUCT = 3;
const DEMO_STOCK = 10;

export const demoStoreSchema = z.object({
  /** Needed only when the demo seller does not exist yet. */
  email: emailSchema.optional(),
  mobile: mobileSchema.optional(),
  password: passwordSchema.optional(),
});

type Pick = { detail: ProductDetail; department: "interior" | "multimedia"; group: string };

/** Seat covers and speakers with a fixed price and a real product photo. */
function demoProducts(): Pick[] {
  const ok = (d: ProductDetail) =>
    d.price !== null && d.availability !== "coming-soon" && d.images.some((i) => i.kind === "remote");
  const take = (dept: "interior" | "multimedia", group: string) =>
    PRODUCT_DETAILS.filter((d) => d.department === dept && d.group === group && ok(d))
      .slice(0, PER_GROUP)
      .map((detail) => ({ detail, department: dept, group }));
  return [...take("interior", "seat-covers"), ...take("multimedia", "speakers")];
}

async function imageBytes(src: string): Promise<Uint8Array<ArrayBuffer> | null> {
  try {
    if (src.startsWith("/")) {
      const file = path.join(process.cwd(), "public", path.normalize(src).replace(/^([/\\])+/, ""));
      if (!file.startsWith(path.join(process.cwd(), "public"))) return null;
      return new Uint8Array(await fs.readFile(file));
    }
    const url = new URL(src);
    if (url.protocol !== "https:") return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function copyImages(vendorId: string, d: ProductDetail): Promise<string[]> {
  const ids: string[] = [];
  for (const img of d.images) {
    if (ids.length >= IMAGES_PER_PRODUCT) break;
    if (img.kind !== "remote") continue;
    const bytes = await imageBytes(img.src);
    if (!bytes) continue;
    try {
      const saved = await saveFile(vendorId, "product_image", new File([bytes], path.basename(img.src.split("?")[0]) || "photo"));
      ids.push(saved.id);
    } catch {
      /* not a JPG/PNG/WebP or too large: skip this photo */
    }
  }
  return ids;
}

const ONBOARDING: VendorOnboarding = {
  store: {
    storeName: DEMO_NAME,
    slug: DEMO_SLUG,
    sellerType: "Retailer",
    description: "Demo store: seat covers and car speakers, shown on the offline store screen.",
    departments: ["interior", "multimedia"],
    brands: [{ name: "Various", authType: "Authorised" }],
    logoFileId: null,
    bannerFileId: null,
  },
  shipping: {
    pickup: { line1: "Demo address", line2: null, city: "Bengaluru", state: "Karnataka", pincode: "560068" },
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

  // Refresh the demo products; the seller's own products stay.
  const old = await sql<{ images: string[] }>("DELETE FROM vendor_products WHERE vendor_id = $1 AND sku LIKE $2 RETURNING images", [
    vendor.id,
    `${SKU_PREFIX}%`,
  ]);
  const oldFiles = old.flatMap((r) => r.images ?? []);
  if (oldFiles.length) await sql("DELETE FROM files WHERE vendor_id = $1 AND id = ANY($2)", [vendor.id, oldFiles]);

  let products = 0;
  let photos = 0;
  for (const [i, { detail: d, department, group }] of demoProducts().entries()) {
    const images = await copyImages(vendor.id, d);
    if (images.length === 0) continue;
    photos += images.length;
    const price = d.price!;
    const mrp = Math.max(d.mrp ?? price, price);
    const fitment = d.fitment.length && !d.fitment.includes("universal") ? d.fitment.slice(0, 60) : ["universal"];
    // Model codes tell similar products apart (the shop shows "SAM65 — L-1 Series …").
    const title = d.code && !d.title.toLowerCase().includes(d.code.toLowerCase()) ? `${d.code} — ${d.title}` : d.title;
    await sql(
      `INSERT INTO vendor_products (id, vendor_id, slug, status, title, brand, department, group_slug, sku, gst_rate, mrp, price,
                                    stock, low_stock_at, part_type, summary, highlights, specs, fitment, images,
                                    submitted_at, approved_at, approved_by)
       VALUES ($1, $2, $3, 'live', $4, $5, $6, $7, $8, 18, $9, $10, $11, 3, 'genuine', $12, $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb,
               now(), now(), $17)`,
      [
        newId("vp"), vendor.id, await newSlug(sql, d.brandName, title), title.slice(0, 120), d.brandName.slice(0, 60),
        department, group, `${SKU_PREFIX}${String(i + 1).padStart(2, "0")}`, mrp, price, DEMO_STOCK,
        d.summary?.slice(0, 1500) ?? null,
        JSON.stringify(d.highlights.map((h) => h.slice(0, 140)).slice(0, 8)),
        JSON.stringify(d.specs.slice(0, 20).map((s) => ({ label: s.label.slice(0, 40), value: s.value.slice(0, 120) }))),
        JSON.stringify(fitment), JSON.stringify(images), by.id,
      ],
    );
    products++;
  }

  await audit(by, "demo_store.seed", { vendorId: vendor.id, ip, detail: { action, products, photos } });
  return { vendorId: vendor.id, slug: DEMO_SLUG, action, products, photos };
}
