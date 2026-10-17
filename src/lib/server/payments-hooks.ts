import "server-only";

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
 * Intended for the confirmation email and the GST invoice (Phase 4, invoices/email work).
 * It is a no-op until that work fills it in.
 */
export type OrderConfirmedReason = "online_paid" | "whatsapp_placed";

export async function onOrderConfirmed(orderId: string, reason: OrderConfirmedReason): Promise<void> {
  void orderId;
  void reason;
}
