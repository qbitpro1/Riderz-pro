import type { VendorOrderStatus } from "@/lib/vendor/types";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** Fixed time zone so the server and the browser print the same day. */
export const fmtDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");
export const fmtDateTime = (iso: string | null | undefined) => (iso ? dateTimeFmt.format(new Date(iso)) : "—");

/** Text colour for a status chip. */
export const STATUS_TONE: Record<VendorOrderStatus, string> = {
  new: "text-gold border-gold/40",
  accepted: "text-accent border-accent/40",
  packed: "text-accent border-accent/40",
  shipped: "text-accent border-accent/40",
  delivered: "text-accent border-accent/40",
  cancelled: "text-danger border-danger/40",
  return_requested: "text-gold border-gold/40",
  returned: "text-danger border-danger/40",
};

/** CSV cell: quotes doubled, formula starts neutralised. */
export function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
