import "server-only";

import { z } from "zod";
import { sql, sqlOne } from "@/lib/db/client";

/**
 * A SIGNED-IN SHOPPER'S CART
 *
 * The browser keeps the cart (CartContext); for a signed-in customer it is also saved here, so it
 * follows them to another device and survives a cleared browser. The lines are the browser's own
 * display snapshot: prices are never trusted from here, checkout prices every line again on the
 * server (src/lib/server/orders.ts).
 */

export const CART_MAX_LINES = 50;

const imageSchema = z.union([
  z.object({ kind: z.literal("media"), key: z.string().max(100), alt: z.string().max(200) }),
  z.object({
    kind: z.literal("remote"),
    src: z.string().max(500).refine((v) => /^https:\/\//.test(v) || (v.startsWith("/") && !v.startsWith("//")), "Not an image link"),
    alt: z.string().max(200),
    fit: z.enum(["contain", "cover"]),
    tone: z.enum(["light", "dark"]),
  }),
]);

export const cartLineSchema = z.object({
  id: z.string().min(1).max(300),
  slug: z.string().min(1).max(200),
  href: z.string().max(300).refine((v) => v.startsWith("/") && !v.startsWith("//") && !v.includes("\\"), "Not a site link"),
  name: z.string().min(1).max(200),
  variant: z.string().max(200).optional(),
  image: imageSchema.optional(),
  price: z.number().int().min(0).max(10_000_000),
  qty: z.number().int().min(1).max(99),
  install: z.number().int().min(0).max(1_000_000).optional(),
  seller: z.object({ id: z.string().max(60), name: z.string().max(120), slug: z.string().max(80) }).optional(),
});
export type SavedCartLine = z.infer<typeof cartLineSchema>;
export const cartSchema = z.object({ lines: z.array(cartLineSchema).max(CART_MAX_LINES) });

export async function getCart(customerId: string): Promise<{ lines: SavedCartLine[]; updatedAt: string | null }> {
  const row = await sqlOne<{ lines: SavedCartLine[]; updated_at: Date }>("SELECT lines, updated_at FROM customer_carts WHERE customer_id = $1", [customerId]);
  return { lines: row?.lines ?? [], updatedAt: row ? new Date(row.updated_at).toISOString() : null };
}

/** Replaces the saved cart (the browser sends its whole cart after each change). */
export async function saveCart(customerId: string, lines: SavedCartLine[]): Promise<void> {
  const unique = [...new Map(lines.map((l) => [l.id, l])).values()];
  await sql(
    `INSERT INTO customer_carts (customer_id, lines, updated_at) VALUES ($1, $2::jsonb, now())
     ON CONFLICT (customer_id) DO UPDATE SET lines = EXCLUDED.lines, updated_at = now()`,
    [customerId, JSON.stringify(unique)],
  );
}
