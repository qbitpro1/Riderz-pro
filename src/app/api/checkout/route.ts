import { NextResponse } from "next/server";
import { assertNoUserErrors, ShopifyError, storefront, type UserError } from "@/lib/shopify/client";
import { isShopifyConfigured } from "@/lib/shopify/config";
import { canonicalLineId, checkBuyable, resolveLines, type LineRequest } from "@/lib/shopify/variants";

export const dynamic = "force-dynamic";

const MAX_LINES = 50;
const MAX_BODY_BYTES = 16_000;

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type CartCreateData = {
  cartCreate: { cart: { checkoutUrl: string } | null; userErrors: UserError[] };
};

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * POST { lines: [{ id, qty }] } -> { checkoutUrl }.
 * Only line ids and quantities are read; prices always come from Shopify.
 */
export async function POST(req: Request) {
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return bad("Unreadable request");
  }
  if (raw.length > MAX_BODY_BYTES) return bad("Request too large");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return bad("Invalid JSON");
  }
  const list = (body as { lines?: unknown } | null)?.lines;
  if (!Array.isArray(list) || list.length < 1 || list.length > MAX_LINES) {
    return bad(`lines must be an array of 1 to ${MAX_LINES} items`);
  }

  const lines: LineRequest[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const id = (item as { id?: unknown } | null)?.id;
    const qty = (item as { qty?: unknown } | null)?.qty;
    if (typeof id !== "string" || id.length === 0 || id.length > 300) return bad("Invalid line id");
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return bad("qty must be an integer from 1 to 99");
    }
    // Option order must not make two copies of one line look different.
    const canonical = canonicalLineId(id);
    if (!canonical) return bad("Invalid line id");
    if (seen.has(canonical)) return bad("Duplicate line");
    seen.add(canonical);
    // Buyability is judged from the catalogue before Shopify config is consulted,
    // so a bad cart gets the same 400 whether or not checkout is switched on.
    const buyable = checkBuyable(canonical);
    if (!buyable.ok) return bad(buyable.reason);
    lines.push({ id: canonical, qty });
  }

  if (!isShopifyConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }

  try {
    const results = await resolveLines(lines);
    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      return NextResponse.json(
        {
          error: "Some items could not be checked out",
          failed: failed.map((f) => ({ id: f.id, reason: f.ok ? "" : f.reason })),
        },
        { status: 409 },
      );
    }

    const data = await storefront<CartCreateData>(CART_CREATE, {
      input: {
        lines: results.flatMap((r) => (r.ok ? [{ merchandiseId: r.variantId, quantity: r.qty }] : [])),
      },
    });
    assertNoUserErrors(data.cartCreate.userErrors);
    const url = data.cartCreate.cart?.checkoutUrl;
    if (!url) throw new ShopifyError("graphql", "No checkout URL returned");
    return NextResponse.json({ checkoutUrl: url });
  } catch (e) {
    // Log the kind and message only: ShopifyError never contains the token.
    console.error("[checkout]", e instanceof ShopifyError ? `${e.kind}: ${e.message}` : "unexpected error");
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please order on WhatsApp." },
      { status: 502 },
    );
  }
}
