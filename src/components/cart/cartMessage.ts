import { rupees } from "@/lib/format";
import type { CartLine } from "@/lib/store/types";

/** The WhatsApp order text, shared by the cart drawer and the /cart page. */
export function orderMessage(
  lines: CartLine[],
  t: { subtotal: number; installTotal: number; shipping: number; total: number },
): string {
  return [
    "Hi Riderzpro, I'd like to place this order:",
    "",
    ...lines.map(
      (l) =>
        `• ${l.name}${l.variant ? ` (${l.variant})` : ""} × ${l.qty} — ${rupees(l.price * l.qty)}${
          l.install ? ` (+ installation ${rupees(l.install * l.qty)})` : ""
        }`,
    ),
    "",
    `Subtotal: ${rupees(t.subtotal)}`,
    ...(t.installTotal ? [`Installation: ${rupees(t.installTotal)}`] : []),
    `Shipping: ${t.shipping === 0 ? "Free" : rupees(t.shipping)}`,
    `Total: ${rupees(t.total)}`,
    "",
    "My car is: ",
    "Delivery address: ",
  ].join("\n");
}
