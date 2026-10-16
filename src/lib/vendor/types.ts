/**
 * THE VENDOR CONTRACT
 *
 * Shapes and status values shared by the vendor portal, the admin queues, the
 * API routes and the shop. Types and constants only — nothing secret, no
 * database access — so client components may import this file.
 *
 * The status values must match the CHECK constraints in src/lib/db/migrations.ts.
 */

import type { DepartmentSlug } from "@/lib/data/taxonomy";

/* ---------------------------------------------------------------- vendor */

export const VENDOR_STATUSES = [
  "draft", // signed up, onboarding not submitted
  "submitted", // onboarding submitted, waiting in the KYC queue
  "under_review", // an admin has opened the application
  "approved", // can list products and receive orders
  "changes_requested", // admin flagged sections; vendor edits only those and resubmits
  "rejected",
  "suspended", // was approved; products hidden, portal read-only
] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const BUSINESS_TYPES = ["Individual", "Proprietorship", "Partnership", "Private Limited", "LLP", "Public Limited"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const SELLER_TYPES = ["Manufacturer", "Authorised dealer", "Distributor", "Retailer"] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

export const BRAND_AUTH_TYPES = ["Own brand", "Authorised", "Unbranded"] as const;
export type BrandAuthType = (typeof BRAND_AUTH_TYPES)[number];

export const ID_TYPES = ["PAN", "Passport", "Voter ID", "Driving licence"] as const;
export type IdType = (typeof ID_TYPES)[number];

export const VENDOR_TIERS = ["standard", "gold", "platinum"] as const;
export type VendorTier = (typeof VENDOR_TIERS)[number];

/** The six onboarding steps, in order. `id` is used for "changes requested" flags. */
export const ONBOARDING_STEPS = [
  { step: 1, id: "account", title: "Account" },
  { step: 2, id: "tax", title: "Tax details" },
  { step: 3, id: "store", title: "Store" },
  { step: 4, id: "shipping", title: "Shipping & pickup" },
  { step: 5, id: "bank", title: "Bank details" },
  { step: 6, id: "documents", title: "Documents & review" },
] as const;
export type OnboardingSectionId = (typeof ONBOARDING_STEPS)[number]["id"];

/** Non-secret onboarding answers, stored as JSON on the vendor row. */
export type VendorOnboarding = {
  tax?: {
    gstExempt: boolean;
    gstin: string | null;
    legalName: string;
    tradeName: string | null;
    /** Derived from the GSTIN when there is one; otherwise typed. Stored sealed — only last 4 here. */
    panLast4: string;
    idType: IdType;
    idLast4: string;
  };
  store?: {
    storeName: string;
    slug: string;
    sellerType: SellerType;
    description: string;
    departments: DepartmentSlug[];
    brands: { name: string; authType: BrandAuthType }[];
    logoFileId: string | null;
    bannerFileId: string | null;
  };
  shipping?: {
    pickup: { line1: string; line2: string | null; city: string; state: string; pincode: string };
    contactPhone: string;
    /** Working days from order to dispatch. */
    handlingDays: number;
    shipsTo: "pan_india" | "own_state";
    acceptsReturns: boolean;
    returnWindowDays: number;
  };
  bank?: {
    holderName: string;
    accountLast4: string;
    ifsc: string;
  };
  documents?: {
    files: { kind: DocumentKind; fileId: string; name: string }[];
    agreement: { signatoryName: string; acceptedAt: string };
  };
};

export const DOCUMENT_KINDS = ["doc_pan", "doc_gst", "doc_cheque", "doc_trade_license", "doc_brand_auth"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_LABELS: Record<DocumentKind, string> = {
  doc_pan: "PAN card",
  doc_gst: "GST registration certificate",
  doc_cheque: "Cancelled cheque",
  doc_trade_license: "Trade licence / shop establishment",
  doc_brand_auth: "Brand authorisation letter",
};

export type ChangesRequested = {
  sections: OnboardingSectionId[];
  note: string;
  requestedAt: string;
};

/** What the vendor's own browser sees about their account. Never contains secrets. */
export type VendorSelf = {
  id: string;
  email: string;
  mobile: string;
  fullName: string;
  businessType: BusinessType;
  status: VendorStatus;
  emailVerified: boolean;
  mobileVerified: boolean;
  storeName: string | null;
  slug: string | null;
  onboarding: VendorOnboarding;
  currentStep: number;
  completedSteps: number[];
  commissionRate: number | null;
  tier: VendorTier | null;
  changesRequested: ChangesRequested | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
};

/** Where a signed-in vendor belongs, by status. */
export function vendorHome(status: VendorStatus): string {
  if (status === "draft" || status === "changes_requested") return "/vendor/onboarding";
  if (status === "approved" || status === "suspended") return "/vendor/dashboard";
  return "/vendor/pending";
}

/* --------------------------------------------------------------- product */

export const PRODUCT_STATUSES = ["draft", "pending_review", "live", "changes_requested", "rejected", "archived"] as const;
export type VendorProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PART_TYPES = ["oem", "genuine", "aftermarket"] as const;
export type PartType = (typeof PART_TYPES)[number];
export const PART_TYPE_LABELS: Record<PartType, string> = {
  oem: "OEM (Original Equipment)",
  genuine: "Genuine brand part",
  aftermarket: "Aftermarket",
};

export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GstRate = (typeof GST_RATES)[number];

/** Content fields — changing them on a live product needs review again. */
export type VendorProductContent = {
  title: string;
  brand: string;
  department: DepartmentSlug;
  groupSlug: string;
  partType: PartType;
  hsn: string | null;
  gstRate: GstRate;
  warrantyMonths: number | null;
  summary: string | null;
  highlights: string[];
  specs: { label: string; value: string }[];
  /** Vehicle model slugs from src/lib/data/vehicles.ts, or ["universal"]. */
  fitment: string[];
  /** File ids of product images, in display order (1–8). */
  images: string[];
};

/** Commercial fields — a vendor may change these on a live product without review. */
export type VendorProductCommercial = {
  sku: string;
  mrp: number;
  price: number;
  stock: number;
  lowStockAt: number;
};

export type VendorProduct = VendorProductContent &
  VendorProductCommercial & {
    id: string;
    vendorId: string;
    slug: string;
    status: VendorProductStatus;
    /** Content edits to a live product, waiting for review. The live content stays on sale meanwhile. */
    pendingRevision: VendorProductContent | null;
    reviewNotes: { note: string; fields: string[]; at: string } | null;
    rejectionReason: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };

/* ----------------------------------------------------------------- order */

export const VENDOR_ORDER_STATUSES = [
  "new",
  "accepted",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "return_requested",
  "returned",
] as const;
export type VendorOrderStatus = (typeof VENDOR_ORDER_STATUSES)[number];

/** Moves a vendor may make on their own order. Admin may also cancel or record returns. */
export const VENDOR_ORDER_MOVES: Partial<Record<VendorOrderStatus, VendorOrderStatus[]>> = {
  new: ["accepted", "cancelled"],
  accepted: ["packed", "cancelled"],
  packed: ["shipped"],
  shipped: ["delivered"],
};

export const VENDOR_ORDER_LABELS: Record<VendorOrderStatus, string> = {
  new: "New",
  accepted: "Accepted",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  return_requested: "Return requested",
  returned: "Returned",
};

/* --------------------------------------------------------------- payouts */

/** GST charged on the platform commission. */
export const COMMISSION_GST_RATE = 0.18;
/** Days after delivery before an order's money is due to the vendor (return window buffer). */
export const SETTLEMENT_DELAY_DAYS = 7;
export const DEFAULT_COMMISSION_RATE = 10;

/** Commission split for one delivered vendor order. All integer rupees. */
export function settlementFor(subtotal: number, commissionRate: number) {
  const commission = Math.round((subtotal * commissionRate) / 100);
  const commissionGst = Math.round(commission * COMMISSION_GST_RATE);
  return { gross: subtotal, commission, commissionGst, net: subtotal - commission - commissionGst };
}

/* ------------------------------------------------------------------ cart */

/** Cart-line slugs for vendor products carry this prefix, so they never collide with house slugs. */
export const VENDOR_LINE_PREFIX = "vendor:";
export const vendorLineSlug = (productSlug: string) => `${VENDOR_LINE_PREFIX}${productSlug}`;
export const isVendorLineSlug = (slug: string) => slug.startsWith(VENDOR_LINE_PREFIX);

/** Public URLs. */
export const storeHref = (vendorSlug: string) => `/store/${vendorSlug}`;
export const vendorProductHref = (vendorSlug: string, productSlug: string) => `/store/${vendorSlug}/${productSlug}`;
export const fileHref = (fileId: string) => `/api/files/${fileId}`;
