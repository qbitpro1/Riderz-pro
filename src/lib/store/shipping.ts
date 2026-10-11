/** Flat shipping fee in rupees, charged below the free-shipping threshold. */
export const SHIPPING_FEE = 149;
/** Orders with a subtotal at or above this ship free. */
export const FREE_SHIPPING_OVER = 2000;

/** Shipping charged for a cart with the given product subtotal. */
export function shippingFor(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
}
