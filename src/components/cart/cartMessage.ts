import { rupees } from "@/lib/format";
import type { CartLine } from "@/lib/store/types";

export type MessageCustomer = {
  name: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes?: string | null;
};

/**
 * The WhatsApp order text, shared by the cart page and its offline fallback.
 * With an `orderNumber` the order is already saved; with `customer` the delivery
 * details come from the checkout form instead of being left blank.
 */
export function orderMessage(
  lines: CartLine[],
  t: { subtotal: number; installTotal: number; shipping: number; total: number },
  extra: { orderNumber?: string; customer?: MessageCustomer } = {},
): string {
  const c = extra.customer;
  return [
    extra.orderNumber ? `Hi Riderzpro, I've placed order ${extra.orderNumber}:` : "Hi Riderzpro, I'd like to place this order:",
    "",
    ...lines.map(
      (l) =>
        `• ${l.name}${l.variant ? ` (${l.variant})` : ""} × ${l.qty} — ${rupees(l.price * l.qty)}${
          l.install ? ` (+ installation ${rupees(l.install * l.qty)})` : ""
        }${l.seller ? ` · sold by ${l.seller.name}` : ""}`,
    ),
    "",
    `Subtotal: ${rupees(t.subtotal)}`,
    ...(t.installTotal ? [`Installation: ${rupees(t.installTotal)}`] : []),
    `Shipping: ${t.shipping === 0 ? "Free" : rupees(t.shipping)}`,
    `Total: ${rupees(t.total)}`,
    "",
    ...(extra.orderNumber ? [`Order ${extra.orderNumber}`, ""] : []),
    "My car is: ",
    ...(c
      ? [
          `Name: ${c.name}`,
          `Mobile: ${c.mobile}`,
          `Delivery address: ${c.address}, ${c.city}, ${c.state} ${c.pincode}`,
          ...(c.notes ? [`Notes: ${c.notes}`] : []),
        ]
      : ["Delivery address: "]),
  ].join("\n");
}
