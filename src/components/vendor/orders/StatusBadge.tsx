import { VENDOR_ORDER_LABELS, type VendorOrderStatus } from "@/lib/vendor/types";
import { STATUS_TONE } from "./format";

export function StatusBadge({ status }: { status: VendorOrderStatus }) {
  return <span className={`chip bg-transparent ${STATUS_TONE[status]}`}>{VENDOR_ORDER_LABELS[status]}</span>;
}
