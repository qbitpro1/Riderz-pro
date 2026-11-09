import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { z } from "zod";
import { DEPARTMENTS, placeSub, type DepartmentSlug } from "@/lib/data/taxonomy";
import { GST_RATES, PART_TYPES, type VendorProduct } from "@/lib/vendor/types";
import { groupExists, productContentSchema } from "@/lib/vendor/validators";
import { ApiError } from "./http";
import { saveFile } from "./files";
import { createProduct, type ContentPatch } from "./vendor-catalogue";

/**
 * CATALOGUE IMPORT (JSON)
 *
 * A seller uploads many products at once as JSON: `{ "products": [ … ] }` or just `[ … ]`.
 * Every product is created under the signed-in seller (the vendor id comes from the session,
 * never from the file), so on the website it shows as that seller's store. Each product is
 * handled on its own: one bad row is reported and the rest still go in.
 *
 * With `submit` (the default) complete products go to Riderzpro review, as when a product is
 * added by hand; an incomplete one (no photo, say) is kept as a draft and the report says what
 * is missing. Photos may be https links (downloaded and stored, see `fetchImage`) or ids of
 * photos the seller already uploaded.
 */

export const IMPORT_MAX_PRODUCTS = 200;
const MAX_IMAGES_PER_PRODUCT = 8;
const IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 12_000;

const text = (max: number) => z.string().trim().max(max);
const num = z.union([z.number(), z.string().trim().regex(/^\d+(\.\d+)?$/).transform(Number)]);
const intIn = (min: number, max: number) => num.transform((n) => Math.round(n)).pipe(z.number().int().min(min).max(max));

/** One product as a seller writes it. Only title, sku and price are required. */
export const importItemSchema = z
  .object({
    title: text(120).min(1, "Title is required"),
    sku: text(40)
      .min(1, "SKU is required")
      .regex(/^[A-Za-z0-9._/-]+$/, "SKU: use letters, numbers and . _ / - only"),
    price: intIn(1, 10_000_000),
    mrp: intIn(1, 10_000_000).optional(),
    stock: intIn(0, 100_000).default(0),
    lowStockAt: intIn(0, 10_000).default(5),
    brand: text(60).optional(),
    /** A department slug (e.g. "interior") with `group`, or just a category name in `category`. */
    department: text(40).optional(),
    group: text(60).optional(),
    category: text(80).optional(),
    partType: z.enum(PART_TYPES).default("aftermarket"),
    hsn: text(8).regex(/^[0-9]{4}([0-9]{2}){0,2}$/, "HSN codes are 4, 6 or 8 digits").optional(),
    gstRate: num.refine((r) => (GST_RATES as readonly number[]).includes(r), `GST rate must be one of ${GST_RATES.join(", ")}`).default(18),
    warrantyMonths: intIn(0, 120).optional(),
    summary: text(1500).optional(),
    description: text(1500).optional(),
    highlights: z.array(text(140)).max(8).default([]),
    /** `[{ "label": "Storage", "value": "256 GB" }]` or `{ "Storage": "256 GB" }`. */
    specs: z
      .union([
        z.array(z.object({ label: text(40), value: text(120) })),
        z.record(z.string(), z.union([z.string(), z.number()])).transform((o) =>
          Object.entries(o).map(([label, value]) => ({ label: label.trim().slice(0, 40), value: String(value).trim().slice(0, 120) })),
        ),
      ])
      .default([]),
    /** Vehicle model slugs, or ["universal"] (the default). */
    fitment: z.array(text(40).min(1)).max(60).default(["universal"]),
    /** https photo links, or ids of photos already uploaded in the portal. */
    images: z.array(text(2000).min(1)).max(MAX_IMAGES_PER_PRODUCT).default([]),
  })
  .refine((v) => v.mrp === undefined || v.price <= v.mrp, { path: ["price"], message: "Selling price cannot be above MRP" });

export type ImportItem = z.output<typeof importItemSchema>;

export const importRequestSchema = z.object({
  products: z.array(z.unknown()).min(1, "The file has no products").max(IMPORT_MAX_PRODUCTS, `At most ${IMPORT_MAX_PRODUCTS} products per upload`),
  submit: z.boolean().default(true),
});

export type ImportResult = {
  index: number;
  sku: string | null;
  title: string | null;
  outcome: "submitted" | "draft" | "failed";
  productId?: string;
  message?: string;
};

/* ----------------------------------------------------------- placement */

function placement(item: ImportItem): { department: DepartmentSlug; groupSlug: string } {
  const dept = DEPARTMENTS.find((d) => d.slug === item.department?.toLowerCase());
  if (dept && item.group) {
    const g = dept.groups.find((x) => x.slug === item.group!.toLowerCase() || x.name.toLowerCase() === item.group!.toLowerCase());
    if (g && groupExists(dept.slug, g.slug)) return { department: dept.slug, groupSlug: g.slug };
  }
  const label = (item.category ?? item.group ?? "").trim().toLowerCase();
  if (label) {
    for (const d of dept ? [dept] : DEPARTMENTS) {
      const g = d.groups.find((x) => x.slug === label || x.name.toLowerCase() === label);
      if (g) return { department: d.slug, groupSlug: g.slug };
    }
    const placed = placeSub(label);
    if (!dept || placed.department === dept.slug) return { department: placed.department, groupSlug: placed.group };
  }
  if (dept) {
    const more = dept.groups.find((g) => g.slug === "more") ?? dept.groups[0];
    return { department: dept.slug, groupSlug: more.slug };
  }
  return { department: "accessories", groupSlug: "more" };
}

/* -------------------------------------------------------------- photos */

/** True for loopback, private, link-local, CGNAT, multicast and other non-public addresses. */
function nonPublicAddress(ip: string): boolean {
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const x = ip.toLowerCase();
  return x === "::" || x === "::1" || /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || x.startsWith("ff");
}

/**
 * Downloads one product photo for a seller. Only https on the standard port, only hosts that
 * resolve to public addresses, no redirects, at most 5 MB, within 12 seconds: a seller's file
 * must not be able to make the server call internal services.
 */
async function fetchImage(raw: string): Promise<File> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("not a valid link");
  }
  if (url.protocol !== "https:") throw new Error("photo links must start with https://");
  if (url.port && url.port !== "443") throw new Error("photo links can't use a custom port");
  if (url.username || url.password) throw new Error("photo links can't contain a login");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map((a) => a.address);
  if (!addresses.length) throw new Error(`can't find ${host}`);
  if (addresses.some(nonPublicAddress)) throw new Error("that address isn't allowed");

  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS), headers: { accept: "image/*" } });
  if (res.status >= 300 && res.status < 400) throw new Error("the link redirects; use the photo's direct link");
  if (!res.ok || !res.body) throw new Error(`the link answered ${res.status}`);
  if (Number(res.headers.get("content-length") ?? 0) > IMAGE_BYTES) throw new Error("the photo is over 5 MB");

  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > IMAGE_BYTES) {
      await reader.cancel();
      throw new Error("the photo is over 5 MB");
    }
    chunks.push(value);
  }
  const name = url.pathname.split("/").pop() || "photo";
  return new File(chunks as BlobPart[], name.slice(0, 80));
}

const FILE_ID = /^fil_[A-Za-z0-9_-]{10,40}$/;

/* --------------------------------------------------------------- import */

const firstIssue = (err: z.ZodError) => {
  const i = err.issues[0];
  return i ? `${i.path.join(".") || "product"}: ${i.message}` : "Some details need fixing.";
};

const fieldsMessage = (err: ApiError) =>
  err.fields && Object.keys(err.fields).length
    ? Object.entries(err.fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; ")
    : err.message;

export async function importCatalogue(
  vendor: { id: string; storeName: string | null },
  rows: unknown[],
  submit: boolean,
): Promise<{ results: ImportResult[]; created: VendorProduct[] }> {
  const results: ImportResult[] = [];
  const created: VendorProduct[] = [];
  const seenSkus = new Set<string>();
  const photoCache = new Map<string, Promise<string>>();

  const photoId = (src: string): Promise<string> => {
    if (FILE_ID.test(src)) return Promise.resolve(src);
    let p = photoCache.get(src);
    if (!p) {
      p = fetchImage(src).then(async (file) => (await saveFile(vendor.id, "product_image", file)).id);
      photoCache.set(src, p);
    }
    return p;
  };

  for (const [index, row] of rows.entries()) {
    const raw = (row ?? {}) as Record<string, unknown>;
    const label = { sku: typeof raw.sku === "string" ? raw.sku : null, title: typeof raw.title === "string" ? raw.title : null };
    const parsed = importItemSchema.safeParse(row);
    if (!parsed.success) {
      results.push({ index, ...label, outcome: "failed", message: firstIssue(parsed.error) });
      continue;
    }
    const item = parsed.data;
    const skuKey = item.sku.toLowerCase();
    if (seenSkus.has(skuKey)) {
      results.push({ index, ...label, outcome: "failed", message: "This SKU appears earlier in the same file." });
      continue;
    }
    seenSkus.add(skuKey);

    // Photos: keep the ones that could be stored and say which could not.
    const images: string[] = [];
    const photoProblems: string[] = [];
    for (const src of item.images) {
      try {
        images.push(await photoId(src));
      } catch (err) {
        const why = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "could not be stored";
        photoProblems.push(`photo ${src.slice(0, 60)}: ${why}`);
      }
    }

    const { department, groupSlug } = placement(item);
    const content: ContentPatch = {
      title: item.title,
      brand: item.brand || vendor.storeName || "Unbranded",
      department,
      groupSlug,
      partType: item.partType,
      hsn: item.hsn ?? null,
      gstRate: item.gstRate,
      warrantyMonths: item.warrantyMonths ?? null,
      summary: item.summary || item.description || null,
      highlights: item.highlights.filter(Boolean),
      specs: item.specs.filter((s) => s.label && s.value),
      fitment: [...new Set(item.fitment.map((f) => f.toLowerCase()))],
      images,
    };
    const commercial = { sku: item.sku, mrp: item.mrp ?? item.price, price: item.price, stock: item.stock, lowStockAt: item.lowStockAt };

    // A complete product goes to review; an incomplete one is saved as a draft with the reason.
    const complete = productContentSchema.safeParse(content);
    const sendForReview = submit && complete.success;
    try {
      const product = await createProduct(vendor.id, { content, commercial, submit: sendForReview });
      created.push(product);
      const notes = [...photoProblems];
      if (submit && !complete.success) notes.unshift(`saved as a draft: ${firstIssue(complete.error)}`);
      results.push({
        index,
        sku: item.sku,
        title: item.title,
        outcome: sendForReview ? "submitted" : "draft",
        productId: product.id,
        ...(notes.length ? { message: notes.join("; ") } : {}),
      });
    } catch (err) {
      const message = err instanceof ApiError ? fieldsMessage(err) : "Could not be saved. Please try again.";
      if (!(err instanceof ApiError)) console.error("[import]", err instanceof Error ? err.message : err);
      results.push({ index, sku: item.sku, title: item.title, outcome: "failed", message });
    }
  }
  return { results, created };
}
