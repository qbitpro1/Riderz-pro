import type { VendorOrderStatus } from "@/lib/vendor/types";
import type { OrderItemView } from "@/components/vendor/orders/types";

export type OrderStatus = "placed" | "confirmed" | "completed" | "cancelled";
export const ORDER_STATUSES: readonly OrderStatus[] = ["placed", "confirmed", "completed", "cancelled"];
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type AdminOrderPart = {
  id: string;
  vendorId: string;
  storeName: string;
  status: VendorOrderStatus;
  subtotal: number;
  commissionRate: number;
  courier: string | null;
  trackingNumber: string | null;
  cancelReason: string | null;
  paidOut: boolean;
  deliveredAt: string | null;
  items: OrderItemView[];
};

export type AdminOrder = {
  id: string;
  number: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  notes: string | null;
  subtotal: number;
  shipping: number;
  total: number;
  channel: string;
  createdAt: string;
  parts: AdminOrderPart[];
  /** Items the house sells directly (not tied to a seller). */
  houseItems: OrderItemView[];
};
