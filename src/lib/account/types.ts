/**
 * Customer account shapes shared by the account pages and the API that feeds them.
 * Types and plain helpers only — safe for client components.
 */
import type { VendorOrderStatus } from "@/lib/vendor/types";
import type { OrderStatus } from "@/components/admin/orders/types";
import type { TicketTopic } from "./schemas";

export type SavedCar = { brandSlug: string; modelSlug: string; variant: string; year: number; label: string };

/** The signed-in customer, as the browser sees them. */
export type CustomerSelf = {
  id: string;
  name: string | null;
  mobile: string | null;
  email: string | null;
  mobileVerified: boolean;
  emailVerified: boolean;
  car: SavedCar | null;
};

export type AddressView = {
  id: string;
  label: string;
  name: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};
export const ADDRESS_MAX = 10;

export type AccountOrderItem = {
  id: string;
  title: string;
  variant: string | null;
  qty: number;
  unitPrice: number;
  installPrice: number;
  lineTotal: number;
  /** Product page, when the product is still on the site. */
  href: string | null;
};

/** One shipment of an order: a seller's part, or the items Riderzpro sends itself. */
export type AccountOrderPart = {
  key: string;
  seller: string;
  /** For seller parts the seller's progress; Riderzpro's own items follow the order status. */
  status: VendorOrderStatus | null;
  courier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items: AccountOrderItem[];
  /** A Riderzpro rider delivering this shipment (Delhi NCR). `code` is shown while it is on its way. */
  rider: { firstName: string; vehicle: string; status: "offered" | "accepted" | "picked_up" | "delivered" | "declined" | "cancelled"; code: string | null } | null;
};

export type AccountOrderSummary = {
  number: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
  itemCount: number;
  firstItem: string;
};

export type AccountOrder = AccountOrderSummary & {
  subtotal: number;
  shipping: number;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  parts: AccountOrderPart[];
};

export type TicketView = {
  id: string;
  topic: TicketTopic;
  orderNumber: string | null;
  body: string;
  status: "open" | "answered" | "closed";
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

/** "98•••••210" / "as•••@gmail.com" — enough to recognise, not enough to copy. */
export function maskContact(value: string): string {
  if (value.includes("@")) {
    const [user, domain] = value.split("@");
    return `${user.slice(0, 2)}•••@${domain}`;
  }
  return `${value.slice(0, 2)}••••••${value.slice(-2)}`;
}

/** Where to go after signing in: a page on this site only, never the API or another site. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || next.startsWith("/api")) return "/account";
  if (next.startsWith("/account/sign-in")) return "/account";
  return next;
}

/** What a shopper sees for each stage (worded for them, not the seller). */
export const PART_STATUS_LABELS: Record<VendorOrderStatus, string> = {
  new: "Order received",
  accepted: "Confirmed by seller",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  returned: "Returned",
};

export const ORDER_STATUS_TEXT: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** The steps shown as a progress line for a seller's part of an order. */
export const PART_STEPS: VendorOrderStatus[] = ["new", "accepted", "packed", "shipped", "delivered"];

/** "17 Oct 2026" */
export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
