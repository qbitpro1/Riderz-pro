/**
 * Order shapes shared by the vendor and admin order screens and the API that
 * feeds them. Types only — safe for client components.
 */
import type { VendorOrderStatus } from "@/lib/vendor/types";

export type OrderItemView = {
  id: string;
  productKind: "house" | "vendor";
  productRef: string;
  title: string;
  variant: string | null;
  unitPrice: number;
  installPrice: number;
  qty: number;
  lineTotal: number;
  /** Only filled for marketplace items (invoice). */
  hsn?: string | null;
  gstRate?: number | null;
};

/** One row of a vendor's order list. Never contains another seller's data. */
export type VendorOrderListItem = {
  id: string;
  number: string;
  createdAt: string;
  status: VendorOrderStatus;
  customerName: string;
  city: string;
  state: string;
  pincode: string;
  itemCount: number;
  firstTitle: string;
  subtotal: number;
  courier: string | null;
  trackingNumber: string | null;
};

/** What a seller needs to pack and ship one order. */
export type VendorOrderDetail = VendorOrderListItem & {
  customerPhone: string;
  address: string;
  notes: string | null;
  items: OrderItemView[];
  cancelReason: string | null;
  commissionRate: number;
  acceptedAt: string | null;
  packedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  returnedAt: string | null;
};

/** Tabs on the vendor orders page. */
export const ORDER_TABS = [
  { id: "new", label: "New", statuses: ["new"] },
  { id: "accepted", label: "Accepted", statuses: ["accepted"] },
  { id: "packed", label: "Packed", statuses: ["packed"] },
  { id: "shipped", label: "Shipped", statuses: ["shipped"] },
  { id: "delivered", label: "Delivered", statuses: ["delivered"] },
  { id: "cancelled", label: "Cancelled & returns", statuses: ["cancelled", "return_requested", "returned"] },
] as const satisfies readonly { id: string; label: string; statuses: readonly VendorOrderStatus[] }[];
export type OrderTabId = (typeof ORDER_TABS)[number]["id"];
