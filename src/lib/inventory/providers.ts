/**
 * Vehicle data enrichment providers.
 *
 * Once a supplier gives us a car, these services fill in the gaps — decoding a
 * registration number into make, model, variant, fuel and registration year so
 * a dealer does not have to type it and cannot get it wrong.
 *
 * Researched August 2026. Status reflects what the provider publishes, not what
 * we assume: anything not confirmed is marked so, and none of these is wired up
 * until an account exists and the data-protection position has been checked.
 */

export type ProviderKind = "registration-lookup" | "vin-decode" | "market-valuation" | "dms-integration";

export type ProviderStatus =
  /** Account exists, credentials configured, connector live. */
  | "CONNECTED"
  /** Publicly available and suitable — needs an account and a contract review. */
  | "AVAILABLE"
  /** Looks relevant but terms or coverage need checking before use. */
  | "NEEDS_REVIEW";

export type EnrichmentProvider = {
  id: string;
  name: string;
  kind: ProviderKind;
  status: ProviderStatus;
  homepage: string;
  /** What it returns, as published by the provider. */
  returns: string[];
  commercialUse: "published" | "unconfirmed";
  pricingNote: string | null;
  /** Why it is or is not in use. */
  note: string;
};

export const ENRICHMENT_PROVIDERS: EnrichmentProvider[] = [
  {
    id: "carregistrationapi-in",
    name: "Car Registration API (India)",
    kind: "registration-lookup",
    status: "AVAILABLE",
    homepage: "https://www.carregistrationapi.in/",
    returns: ["Make", "Model", "Variant", "Fuel", "Registration year", "Engine", "Vehicle class"],
    commercialUse: "published",
    pricingNote: "Published as ₹1.38 per lookup, sold in blocks from 1,000.",
    note:
      "Returns details for vehicles on the national VAHAN register. SOAP service, callable from anything. Per-lookup pricing suits us — we only enrich on intake, not on every page view.",
  },
  {
    id: "eko-rc-verification",
    name: "Eko Platform Services — Vehicle & RC Verification",
    kind: "registration-lookup",
    status: "AVAILABLE",
    homepage: "https://eps.eko.in/products/vehicle-rc-verification-api",
    returns: ["RC status", "Ownership type (private/commercial)", "Registration details", "Insurance status"],
    commercialUse: "published",
    pricingNote: "Per-verification pricing; commercial plans published.",
    note:
      "Verifies against RTO/VAHAN records in real time. The stronger option where we need RC and ownership confirmation rather than just spec decoding — i.e. for the Riderzpro Verified tier.",
  },
  {
    id: "vahan-open-data",
    name: "State RTA open datasets (e.g. Telangana RTA)",
    kind: "registration-lookup",
    status: "NEEDS_REVIEW",
    homepage: "https://aikosh.indiaai.gov.in/",
    returns: ["Aggregate registration data"],
    commercialUse: "published",
    pricingNote: "Free, under the Open Government Licence — India.",
    note:
      "Useful for market context and model-mix analysis, not for looking up an individual car. Coverage is per-state and historical.",
  },
  {
    id: "dms-feed-generic",
    name: "Dealer management systems (generic feed)",
    kind: "dms-integration",
    status: "CONNECTED",
    homepage: "https://riderzpro.com/partners",
    returns: ["Full stock list", "Prices", "Status", "Photos where the dealer supplies them"],
    commercialUse: "published",
    pricingNote: null,
    note:
      "Every DMS on the market exports CSV or XML for syndication — that is how dealers already feed Autotrader, Facebook and the rest. We accept the file they already produce instead of asking them to build an integration. This is why the bulk upload connector is the fastest route to real volume.",
  },
];

/**
 * Enrichment is opt-in per vehicle and never invents data: if the lookup fails
 * or returns nothing, the field stays empty and the listing says "Not specified".
 */
export const ENRICHMENT_POLICY = [
  "We only look up a registration number a supplier has given us for a car they are selling.",
  "Results fill blank fields. They never overwrite something the supplier stated — a conflict is flagged for a human instead.",
  "We do not retrieve or store the registered keeper's personal details.",
  "Registration numbers are not published on listings; buyers see them only after an enquiry is qualified.",
  "If a lookup fails, the field stays empty. Nothing is inferred from a similar vehicle.",
];

export function providersByKind(kind: ProviderKind): EnrichmentProvider[] {
  return ENRICHMENT_PROVIDERS.filter((p) => p.kind === kind);
}
