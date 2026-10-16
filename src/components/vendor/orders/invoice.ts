import type { OrderItemView } from "./types";

/**
 * GST tax-invoice maths. Prices are GST-inclusive, so
 *   taxable = amount x 100 / (100 + rate),  tax = amount - taxable.
 * Within one state the tax splits into CGST + SGST; across states it is IGST.
 * All integer rupees (the last rupee of an odd tax goes to SGST).
 */
export type InvoiceLine = {
  title: string;
  variant: string | null;
  hsn: string | null;
  qty: number;
  /** GST-inclusive unit price. */
  rate: number;
  gstRate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  amount: number;
};

export function invoiceLines(items: OrderItemView[], opts: { gstExempt: boolean; intraState: boolean }): InvoiceLine[] {
  return items.map((i) => {
    const amount = i.unitPrice * i.qty;
    const gstRate = opts.gstExempt ? 0 : (i.gstRate ?? 18);
    const taxable = Math.round((amount * 100) / (100 + gstRate));
    const tax = amount - taxable;
    const half = Math.floor(tax / 2);
    return {
      title: i.title,
      variant: i.variant,
      hsn: i.hsn ?? null,
      qty: i.qty,
      rate: i.unitPrice,
      gstRate,
      taxable,
      cgst: opts.intraState ? half : 0,
      sgst: opts.intraState ? tax - half : 0,
      igst: opts.intraState ? 0 : tax,
      amount,
    };
  });
}

export const sameState = (a: string | undefined, b: string | undefined) =>
  Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());
