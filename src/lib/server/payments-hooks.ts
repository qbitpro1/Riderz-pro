import "server-only";

import { onOrderConfirmedMessages } from "./order-emails";

/**
 * ORDER LIFECYCLE HOOKS
 *
 * Called after the database work has committed, so nothing here can undo an order or a payment.
 * Callers already catch and log errors, but keep each hook fast and never let it throw.
 *
 * `onOrderConfirmed` fires exactly once per order:
 *   "online_paid"     the online payment was confirmed (checkout verify, webhook or reconcile)
 *   "whatsapp_placed" a WhatsApp order was placed (payment is settled over WhatsApp)
 *
 * A paid online order gets its GST invoice, confirmation email and SMS here (order-emails.ts).
 * A WhatsApp order is only placed at this point, not confirmed: its messages go out when an admin
 * confirms it (orders.ts adminChangeOrderStatus).
 */
export type OrderConfirmedReason = "online_paid" | "whatsapp_placed";

export async function onOrderConfirmed(orderId: string, reason: OrderConfirmedReason): Promise<void> {
  if (reason === "online_paid") await onOrderConfirmedMessages(orderId);
}
