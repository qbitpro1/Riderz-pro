/**
 * Customer GST tax invoice: the pure parts (no database), shared by the server, the invoice page and
 * the test script. The GST maths itself is the seller invoice's (`invoiceLines`): prices are GST
 * inclusive, integer rupees, CGST + SGST within one state, IGST across states.
 */
import { invoiceLines, sameState, type InvoiceLine } from "@/components/vendor/orders/invoice";
import type { OrderItemView } from "@/components/vendor/orders/types";
import { LOCATIONS, SITE } from "@/lib/data/site";

/* ------------------------------------------------------------ the supplier */

/** GST state codes (first two digits of a GSTIN), by the state names used at checkout. */
export const GST_STATE_CODES: Record<string, string> = {
  "Jammu and Kashmir": "01", "Himachal Pradesh": "02", Punjab: "03", Chandigarh: "04", Uttarakhand: "05",
  Haryana: "06", Delhi: "07", Rajasthan: "08", "Uttar Pradesh": "09", Bihar: "10", Sikkim: "11",
  "Arunachal Pradesh": "12", Nagaland: "13", Manipur: "14", Mizoram: "15", Tripura: "16", Meghalaya: "17",
  Assam: "18", "West Bengal": "19", Jharkhand: "20", Odisha: "21", Chhattisgarh: "22", "Madhya Pradesh": "23",
  Gujarat: "24", "Dadra and Nagar Haveli and Daman and Diu": "26", Maharashtra: "27", Karnataka: "29",
  Goa: "30", Lakshadweep: "31", Kerala: "32", "Tamil Nadu": "33", Puducherry: "34",
  "Andaman and Nicobar Islands": "35", Telangana: "36", "Andhra Pradesh": "37", Ladakh: "38",
};

export const stateForCode = (code: string) => Object.keys(GST_STATE_CODES).find((s) => GST_STATE_CODES[s] === code) ?? null;

const HQ = LOCATIONS.find((l) => l.flagship) ?? LOCATIONS[0];

/**
 * Who issues the invoice. The address is the Bengaluru garage until the registered office address is
 * confirmed (docs/team/Sathwik_work.md §5). The state comes from the GSTIN.
 */
export const SUPPLIER = {
  legalName: SITE.legalName,
  tradeName: SITE.name,
  gstin: SITE.gstin,
  address: HQ.address,
  stateCode: SITE.gstin.slice(0, 2),
  state: stateForCode(SITE.gstin.slice(0, 2)) ?? "Karnataka",
  email: SITE.email,
  phone: SITE.phone,
};

/* --------------------------------------------------------- HSN, SAC, rates */

/**
 * HSN / SAC codes and GST rates for what Riderzpro sells itself. PLACEHOLDERS until the accountant's
 * category list arrives (docs/team/Sathwik_work.md §5): 8708 is "parts and accessories of motor
 * vehicles". Put per-department codes in byDepartment, e.g. audio: { hsn: "8527", gstRate: 18 }.
 */
export const TAX_CODES = {
  goods: { hsn: "8708", gstRate: 18 },
  byDepartment: {} as Record<string, { hsn: string; gstRate: number }>,
  /** Fitting the part (installation): SAC 998714, maintenance and repair of motor vehicles. */
  installation: { hsn: "998714", gstRate: 18 },
  /** Delivery charge: SAC 996812, courier services. */
  delivery: { hsn: "996812", gstRate: 18 },
};

export const goodsTax = (department: string | null | undefined) =>
  (department && TAX_CODES.byDepartment[department]) || TAX_CODES.goods;

/* ------------------------------------------------------- invoice numbering */

/** Indian financial year (April to March) of a moment, in India time: "2026-27". */
export function financialYear(at: Date): string {
  const ist = new Date(at.getTime() + 330 * 60 * 1000); // UTC+05:30, no daylight saving
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** RZP/2026-27/00001 */
export const formatInvoiceNumber = (fy: string, n: number) => `RZP/${fy}/${String(n).padStart(5, "0")}`;

/* ------------------------------------------------------ amount in words */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : "");
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? belowHundred(rest) : ""].filter(Boolean).join(" ");
}

/** Indian numbering (crore, lakh, thousand): 124900 → "Rupees One Lakh Twenty-Four Thousand Nine Hundred Only". */
export function rupeesInWords(amount: number): string {
  let n = Math.round(Math.abs(amount));
  if (n === 0) return "Rupees Zero Only";
  const parts: string[] = [];
  const crore = Math.floor(n / 1_00_00_000);
  n %= 1_00_00_000;
  if (crore) parts.push(`${crore >= 1000 ? rupeesInWords(crore).replace(/^Rupees | Only$/g, "") : belowThousand(crore)} Crore`);
  const lakh = Math.floor(n / 1_00_000);
  n %= 1_00_000;
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (n) parts.push(belowThousand(n));
  return `Rupees ${parts.join(" ")} Only`;
}

/* ---------------------------------------------------------- the document */

export type InvoiceLineKind = "goods" | "installation" | "delivery";
export type CustomerInvoiceLine = InvoiceLine & { kind: InvoiceLineKind };

export type CustomerInvoiceTotals = { taxable: number; cgst: number; sgst: number; igst: number; amount: number };

/**
 * Everything printed on the invoice, frozen when it is issued, so a reprint never changes when the
 * catalogue, the address book or the tax codes do.
 */
export type CustomerInvoiceSnapshot = {
  version: 1;
  number: string;
  issuedAt: string;
  order: { number: string; placedAt: string; total: number };
  supplier: typeof SUPPLIER;
  buyer: { name: string; phone: string; email: string | null; address: string; city: string; state: string; pincode: string };
  placeOfSupply: { state: string; code: string | null };
  intraState: boolean;
  lines: CustomerInvoiceLine[];
  totals: CustomerInvoiceTotals;
  amountInWords: string;
  /** Marketplace items in the same order: sold and invoiced by their sellers, not part of this invoice. */
  sellerItems: { title: string; variant: string | null; qty: number; amount: number; seller: string }[];
};

/** One line to invoice: GST-inclusive unit price. */
export type InvoiceInputLine = {
  kind: InvoiceLineKind;
  title: string;
  variant: string | null;
  qty: number;
  unitPrice: number;
  hsn: string;
  gstRate: number;
};

/** Works out every line and the totals (the seller invoice's maths, line by line). */
export function computeInvoice(input: InvoiceInputLine[], opts: { supplierState: string; buyerState: string }) {
  const intraState = sameState(opts.supplierState, opts.buyerState);
  const views: OrderItemView[] = input.map((l, i) => ({
    id: String(i),
    productKind: "house",
    productRef: "",
    title: l.title,
    variant: l.variant,
    unitPrice: l.unitPrice,
    installPrice: 0,
    qty: l.qty,
    lineTotal: l.unitPrice * l.qty,
    hsn: l.hsn,
    gstRate: l.gstRate,
  }));
  const lines: CustomerInvoiceLine[] = invoiceLines(views, { gstExempt: false, intraState }).map((l, i) => ({ ...l, kind: input[i].kind }));
  const sum = (k: keyof CustomerInvoiceTotals) => lines.reduce((n, l) => n + l[k], 0);
  const totals: CustomerInvoiceTotals = { taxable: sum("taxable"), cgst: sum("cgst"), sgst: sum("sgst"), igst: sum("igst"), amount: sum("amount") };
  return { intraState, lines, totals };
}

/** Tax by rate, for the summary under the lines. */
export function taxByRate(lines: CustomerInvoiceLine[]) {
  const m = new Map<number, CustomerInvoiceTotals>();
  for (const l of lines) {
    const t = m.get(l.gstRate) ?? { taxable: 0, cgst: 0, sgst: 0, igst: 0, amount: 0 };
    t.taxable += l.taxable;
    t.cgst += l.cgst;
    t.sgst += l.sgst;
    t.igst += l.igst;
    t.amount += l.amount;
    m.set(l.gstRate, t);
  }
  return [...m].sort((a, b) => a[0] - b[0]).map(([rate, t]) => ({ rate, ...t }));
}
