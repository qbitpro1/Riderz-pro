/**
 * THE MOTORBOTZ VEHICLE NETWORK
 *
 * Inventory comes to us, rather than us going out and copying it. Every
 * channel below is a supply relationship: a dealer, a fleet, a seller or a
 * partner who has agreed to put their cars in front of Motorbotz buyers.
 */

/** Where a vehicle actually comes from. Drives the badge on every card. */
export type InventoryType =
  | "MOTORBOTZ_OWNED"
  | "DEALER_PARTNER"
  | "CONSIGNMENT"
  | "PRIVATE_SELLER"
  | "MANUFACTURER_CERTIFIED"
  | "FLEET_PARTNER"
  | "AUCTION_PARTNER";

export const INVENTORY_TYPES: Record<
  InventoryType,
  { label: string; badge: string; blurb: string; tone: "accent" | "gold" | "neutral" }
> = {
  MOTORBOTZ_OWNED: {
    label: "Motorbotz Owned",
    badge: "MOTORBOTZ STOCK",
    blurb: "Bought outright by Motorbotz. We hold the car, the papers and the risk.",
    tone: "accent",
  },
  DEALER_PARTNER: {
    label: "Dealer Partner",
    badge: "DEALER PARTNER",
    blurb: "Supplied by a registered dealer under a Motorbotz inventory agreement.",
    tone: "neutral",
  },
  CONSIGNMENT: {
    label: "Consignment",
    badge: "ON CONSIGNMENT",
    blurb: "Owned by the seller, held and sold by Motorbotz on their behalf.",
    tone: "neutral",
  },
  PRIVATE_SELLER: {
    label: "Private Seller",
    badge: "MOTORBOTZ SELLER",
    blurb: "A private owner selling through Motorbotz. Enquiries come to us, not to them.",
    tone: "neutral",
  },
  MANUFACTURER_CERTIFIED: {
    label: "Manufacturer Certified",
    badge: "CERTIFIED PRE-OWNED",
    blurb: "From a manufacturer-certified pre-owned programme, through the franchise dealer.",
    tone: "gold",
  },
  FLEET_PARTNER: {
    label: "Fleet Partner",
    badge: "FLEET RELEASE",
    blurb: "Released from a corporate, rental, leasing or subscription fleet.",
    tone: "neutral",
  },
  AUCTION_PARTNER: {
    label: "Auction Partner",
    badge: "AUCTION PARTNER",
    blurb: "Sourced through a B2B auction or wholesale partner that permits resale listing.",
    tone: "neutral",
  },
};

/**
 * Trust tiers. These are four different statements and must never be
 * conflated — the whole point is that a buyer can tell them apart.
 */
export type VerificationTier =
  /** A vehicle a supplier gave us. Nothing about it has been checked. */
  | "LISTED"
  /** The supplier's identity and registration have been verified. Not the car. */
  | "PARTNER_VERIFIED"
  /** A Motorbotz engineer physically inspected the car. */
  | "MOTORBOTZ_INSPECTED"
  /** Inspection plus documentation verified against the Motorbotz checklist. */
  | "MOTORBOTZ_VERIFIED";

export const VERIFICATION_TIERS: Record<
  VerificationTier,
  { label: string; means: string; tone: "accent" | "gold" | "neutral"; rank: number }
> = {
  LISTED: {
    label: "Listed",
    means: "Supplied by a dealer or seller. Motorbotz has not checked the car or the paperwork.",
    tone: "neutral",
    rank: 0,
  },
  PARTNER_VERIFIED: {
    label: "Partner Verified",
    means: "We have verified who the supplier is — business, GSTIN and address. The car itself is still unchecked.",
    tone: "gold",
    rank: 1,
  },
  MOTORBOTZ_INSPECTED: {
    label: "Motorbotz Inspected",
    means: "A Motorbotz engineer has physically inspected the vehicle on 12 points.",
    tone: "accent",
    rank: 2,
  },
  MOTORBOTZ_VERIFIED: {
    label: "Motorbotz Verified",
    means: "Inspected, and the RC, insurance, service history and ownership chain verified against the vehicle.",
    tone: "accent",
    rank: 3,
  },
};

/* ----------------------------------------------------------- supply channels */

export type ChannelStatus = "LIVE" | "READY_TO_ONBOARD" | "REQUIRES_AGREEMENT";

export type SupplyChannel = {
  id: string;
  name: string;
  inventoryType: InventoryType;
  status: ChannelStatus;
  /** Build order from the acquisition plan. */
  phase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** How inventory physically arrives. */
  intake: ("csv" | "xlsx" | "xml" | "json" | "api" | "google-sheet" | "manual")[];
  blurb: string;
  /** What has to happen before this channel produces vehicles. */
  requirement: string;
};

export const SUPPLY_CHANNELS: SupplyChannel[] = [
  {
    id: "dealer-upload",
    name: "Dealer bulk upload",
    inventoryType: "DEALER_PARTNER",
    status: "LIVE",
    phase: 1,
    intake: ["csv", "xlsx", "xml", "json"],
    blurb:
      "A dealer exports stock from whatever they already use — DMS, Tally, a spreadsheet — and drops the file in. Every DMS on the market exports CSV or XML, so nobody has to build anything.",
    requirement: "Dealer registers and accepts the inventory agreement.",
  },
  {
    id: "dealer-sheet",
    name: "Google Sheet sync",
    inventoryType: "DEALER_PARTNER",
    status: "LIVE",
    phase: 2,
    intake: ["google-sheet"],
    blurb:
      "The smallest dealers keep stock in a shared sheet. They publish it, we poll it. Changing a row to SOLD pulls the car off the site on the next sync.",
    requirement: "Dealer publishes the sheet to the web and pastes the link.",
  },
  {
    id: "dealer-api",
    name: "Dealer API",
    inventoryType: "DEALER_PARTNER",
    status: "LIVE",
    phase: 3,
    intake: ["api"],
    blurb:
      "Dealers with their own website or DMS push straight into Motorbotz: create, update, price change, mark sold, remove, photos, availability.",
    requirement: "Dealer requests an API key from the partner portal.",
  },
  {
    id: "dealer-website-feed",
    name: "Dealer website feed",
    inventoryType: "DEALER_PARTNER",
    status: "READY_TO_ONBOARD",
    phase: 4,
    intake: ["xml", "json", "csv"],
    blurb:
      "We poll the dealer's own inventory feed on their schedule. Same connector as bulk upload, pointed at a URL instead of a file.",
    requirement: "Dealer supplies a feed URL and written permission to display it.",
  },
  {
    id: "manufacturer-cpo",
    name: "Manufacturer certified pre-owned",
    inventoryType: "MANUFACTURER_CERTIFIED",
    status: "REQUIRES_AGREEMENT",
    phase: 5,
    intake: ["csv", "xml", "api"],
    blurb:
      "Maruti True Value, Hyundai Promise, Toyota U Trust, Mahindra First Choice, Honda Auto Terrace and the rest distribute through franchise dealers. Onboard the franchise dealer and the certified stock arrives through the dealer channel.",
    requirement:
      "Franchise dealer agreement, or a syndication arrangement with the programme. Not published as an open feed — this is a business-development conversation.",
  },
  {
    id: "fleet-partner",
    name: "Fleet & leasing releases",
    inventoryType: "FLEET_PARTNER",
    status: "READY_TO_ONBOARD",
    phase: 6,
    intake: ["csv", "xlsx", "api"],
    blurb:
      "Corporate fleets, rental companies, leasing and subscription operators release vehicles in batches — often dozens at a time, with full service history.",
    requirement: "Fleet disposal agreement. Same file formats as a dealer.",
  },
  {
    id: "auction-partner",
    name: "Auction & wholesale",
    inventoryType: "AUCTION_PARTNER",
    status: "REQUIRES_AGREEMENT",
    phase: 6,
    intake: ["csv", "api"],
    blurb:
      "B2B auctions, bank and NBFC repossessions, dealer wholesale networks. High volume, variable condition, needs inspection before it goes public.",
    requirement: "Written permission to list. Many auction platforms restrict onward display.",
  },
  {
    id: "private-seller",
    name: "Private seller intake",
    inventoryType: "PRIVATE_SELLER",
    status: "LIVE",
    phase: 7,
    intake: ["manual"],
    blurb:
      "Owners submit their car through Sell Your Car. It becomes a lead, gets valued and inspected, then is bought, taken on consignment, or passed to a partner dealer.",
    requirement: "Nothing — this channel is open today.",
  },
  {
    id: "motorbotz-owned",
    name: "Motorbotz owned stock",
    inventoryType: "MOTORBOTZ_OWNED",
    status: "LIVE",
    phase: 7,
    intake: ["manual"],
    blurb: "Cars we have bought outright. Our photography, our inspection, our risk.",
    requirement: "Nothing — added by staff.",
  },
];

/* ------------------------------------------------- future marketplace partners */

/**
 * Kept deliberately. These are not sources — they are prospects. The connector
 * architecture takes a new source without touching the marketplace, so the day
 * one of them offers an API or an affiliate feed, it is a registry entry and a
 * connector file.
 */
export const FUTURE_PARTNERS = [
  { id: "cardekho", name: "CarDekho", note: "No open inventory API. Approach for a data partnership or affiliate feed." },
  { id: "cars24", name: "CARS24", note: "No open inventory API. Approach for a syndication agreement." },
  { id: "spinny", name: "Spinny", note: "No open inventory API. Approach for a partner feed." },
  { id: "carwale", name: "CarWale", note: "No open inventory API. Approach for a listing partnership." },
  { id: "olx-autos", name: "OLX Autos", note: "Largely private-seller inventory; personal-data obligations on top of licensing." },
] as const;

export const DEALER_TARGET_REGIONS = [
  { region: "Delhi NCR", priority: 1, cities: ["Delhi", "Gurugram", "Noida", "Faridabad", "Ghaziabad"] },
  { region: "North India", priority: 2, cities: ["Chandigarh", "Jaipur", "Lucknow", "Ludhiana", "Dehradun"] },
  { region: "Metro cities", priority: 3, cities: ["Mumbai", "Pune", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad"] },
];

/* ----------------------------------------------------------- dealer packages */

export const DEALER_PACKAGES = [
  {
    id: "free",
    name: "FREE",
    price: "No cost",
    blurb: "Get your stock in front of Motorbotz buyers. No card, no commitment.",
    features: ["Unlimited listings", "Bulk upload — CSV, Excel, XML, JSON", "Google Sheet sync", "Buyer enquiries by WhatsApp"],
  },
  {
    id: "premium",
    name: "PREMIUM",
    price: "Featured placement",
    blurb: "Move to the top of search and category pages.",
    features: ["Everything in Free", "Featured placement in search", "Priority in Just Landed", "Listing performance reporting"],
  },
  {
    id: "verified",
    name: "VERIFIED DEALER",
    price: "After verification",
    blurb: "We verify your business, and buyers can see it.",
    features: ["Everything in Premium", "Partner Verified badge on every car", "Dealer profile page", "Dealer API access"],
  },
  {
    id: "partner",
    name: "MOTORBOTZ PARTNER",
    price: "By invitation",
    blurb: "Full integration, priority placement and first refusal on our buying pipeline.",
    features: [
      "Everything in Verified Dealer",
      "Priority placement across the site",
      "First refusal on private-seller cars we do not buy",
      "Workshop rates on PPF, audio, detailing and modification",
    ],
  },
] as const;
