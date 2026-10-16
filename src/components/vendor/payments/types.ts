/** Payment shapes shared by the seller payments page, the admin payouts page and their APIs. Types only. */

export type Settlement = { gross: number; commission: number; commissionGst: number; net: number };

export type SettlementRow = Settlement & {
  id: string;
  number: string;
  deliveredAt: string;
  /** in_window: delivered but inside the return window; due: payable now; paid: included in a payout. */
  state: "in_window" | "due" | "paid";
  reference: string | null;
};

export type PayoutRow = Settlement & {
  id: string;
  reference: string | null;
  paidAt: string;
  orders: number;
};

export type MaskedBank = { holder: string; last4: string; ifsc: string };

export type PayoutOverview = {
  delayDays: number;
  summary: {
    inWindow: { count: number; net: number };
    due: { count: number; net: number };
    paid: { count: number; net: number };
  };
  settlements: SettlementRow[];
  payouts: PayoutRow[];
  bank: MaskedBank | null;
};

export type DueVendor = {
  vendorId: string;
  storeName: string;
  bank: MaskedBank | null;
  orders: (Settlement & { id: string; number: string; deliveredAt: string })[];
  net: number;
};
