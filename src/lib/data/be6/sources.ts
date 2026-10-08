/**
 * BE 6 SOURCING TRAIL
 *
 * Every factory figure published on the BE 6 pages carries the id of the
 * source it came from, so a claim can be traced back without guesswork. The
 * rule that governs this file is the same one that governs the supplier
 * catalogues: a number is either sourced or it is not published.
 *
 * `official` = Mahindra's own material. `media` = motoring press, used only
 * where Mahindra has not published the figure in a form we could retrieve.
 * Anything sourced `media` is presentational, never quoted as certified.
 *
 * The official BE 6 SPORTEQ brochure (V1, 14.08.26) is the primary source and
 * outranks everything else here. Where it contradicted the press, the press
 * lost — and several figures we had originally taken from media reporting were
 * wrong.
 */

export type SourceKind = "official" | "media";

export type Source = {
  id: string;
  label: string;
  url: string;
  kind: SourceKind;
  /** ISO date the document was read. Figures are only as fresh as this. */
  retrieved: string;
};

export const SOURCES: Source[] = [
  {
    id: "mahindra-brochure",
    label: "Mahindra BE 6 SPORTEQ brochure (V1, 14.08.26) — official PDF",
    url: "https://www.mahindraelectricsuv.com/on/demandware.static/-/Library-Sites-eSUVSharedLibrary/default/dw5781af15/MBE6/BE6_SPORTEQ_Brochure.pdf",
    kind: "official",
    retrieved: "2026-08-16",
  },
  {
    id: "mahindra-configurator",
    label: "Mahindra eSUV configurator — BE 6 variant and colour selection",
    url: "https://www.mahindraelectricsuv.com/own-online/variant-selection?pid=MBE6",
    kind: "official",
    retrieved: "2026-08-16",
  },
  {
    id: "mahindra-pr-sporteq",
    label: "Mahindra press release — BE 6 SPORTEQ introduction",
    url: "https://www.mahindra.com/news-room/press-release/en/mahindra-introduces-the-be-6-sporteq-a-bold-new-expression-of-sport-technology-and-electric-performance",
    kind: "official",
    retrieved: "2026-08-16",
  },
  {
    id: "autocar-sporteq",
    label: "Autocar India — BE 6 SPORTEQ launch report",
    url: "https://www.autocarindia.com/car-news/mahindra-unveils-be-6-sporteq-launch-edition-440490",
    kind: "media",
    retrieved: "2026-08-16",
  },
  {
    id: "autocarpro-sporteq",
    label: "Autocar Professional — BE 6 SPORTEQ launch",
    url: "https://www.autocarpro.in/news/mahindra-launches-be-6-sporteq-electric-suv-starting-at-rs-1145-lakh-134119",
    kind: "media",
    retrieved: "2026-08-16",
  },
  {
    id: "businesstoday-sporteq",
    label: "Business Today — BE 6 SPORTEQ launched with BaaS",
    url: "https://www.businesstoday.in/auto/story/mahindra-be-6-sporteq-launched-with-baas-price-starting-at-rs11-45-lakh-deliveries-from-august-26-549400-2026-08-15",
    kind: "media",
    retrieved: "2026-08-16",
  },
  {
    id: "wikipedia-be6",
    label: "Wikipedia — Mahindra BE 6",
    url: "https://en.wikipedia.org/wiki/Mahindra_BE_6",
    kind: "media",
    retrieved: "2026-08-16",
  },
];

export function source(id: string): Source | undefined {
  return SOURCES.find((s) => s.id === id);
}

/**
 * OPEN QUESTIONS FOR HUMAN REVIEW
 *
 * Where the official material and the press disagree, or where a figure is
 * quoted widely but never by Mahindra, the discrepancy is recorded here and
 * surfaced in the admin dashboard. It is deliberately not reconciled in code —
 * silently picking a winner is how a wrong number ends up on a price list.
 *
 * `resolved` records the ones the official brochure has since settled. They
 * stay in the file rather than being deleted, because a question that has been
 * answered is worth more than one that was quietly dropped.
 */
export type ReviewFlag = {
  id: string;
  field: string;
  issue: string;
  positions: { claim: string; sourceId: string }[];
  /** What the site does about it. */
  handling: string;
  /** Set once the brochure or another official document settled it. */
  resolved?: string;
};

export const REVIEW_FLAGS: ReviewFlag[] = [
  /* ---- STILL OPEN ------------------------------------------------- */
  {
    id: "kerb-weight",
    field: "Kerb weight",
    issue:
      "Three different figures circulate (2,070 kg, 2,415 kg, and one encyclopaedia entry that repeats the 1,907 mm width figure as kilograms). The official brochure does not give a kerb weight at all.",
    positions: [
      { claim: "2,070 kg", sourceId: "wikipedia-be6" },
      { claim: "Not stated in the brochure", sourceId: "mahindra-brochure" },
    ],
    handling: "Not published. The weight row reads 'awaiting official figure'.",
  },
  {
    id: "interior-theme-mapping",
    field: "Interior theme to variant mapping",
    issue:
      "The brochure lists four interior themes against variant groups, but the columns are laid out in a way that does not survive text extraction cleanly. The themes are certain; which variant each belongs to is not.",
    positions: [
      {
        claim: "Racing Tan / Racing Tan & Black / Black & Firestorm Orange / Sage Green & Grey",
        sourceId: "mahindra-brochure",
      },
    ],
    handling:
      "Theme names published; per-variant mapping withheld until the brochure page is read visually rather than by text extraction.",
  },
  {
    id: "owners-manual-missing",
    field: "Owner's manual cross-check",
    issue:
      "The brief asks for the official BE 6 owner's manual to be used as the factual reference for controls, charging, maintenance, displays, driving modes, systems and emergency procedures. No manual has been supplied. The brochure is a marketing document and is not a substitute.",
    positions: [],
    handling:
      "Manual-dependent sections are built but left unpopulated, marked 'awaiting owner's manual'. Nothing in them is written from memory.",
  },
  {
    id: "imagery-licence",
    field: "Rights to Mahindra photography",
    issue:
      "The vehicle imagery on these pages is Mahindra's copyright, taken from the official BE 6 SPORTEQ brochure and the official configurator, and self-hosted at the customer's direction. Motorbotz's right to reproduce it has not been documented.",
    positions: [],
    handling:
      "In use with attribution to Mahindra on every image. Confirm the licence position with Mahindra or the dealer before the page goes public.",
  },

  /* ---- SETTLED BY THE OFFICIAL BROCHURE ---------------------------- */
  {
    id: "three-screen-variant-split",
    field: "Three-screen cockpit — first variant it appears on",
    issue: "Mahindra's release read as three screens from TWO upwards; launch coverage reported it from THREE upwards.",
    positions: [
      { claim: "TWO variant onwards", sourceId: "mahindra-pr-sporteq" },
      { claim: "THREE variant onwards", sourceId: "businesstoday-sporteq" },
    ],
    handling: "Brochure followed: ONE has dual screens, TWO upwards has the coast-to-coast triple.",
    resolved:
      "Settled by the brochure variant chart. The press release was right and the launch coverage was wrong. Formula E variants keep dual screens even at the top of the range.",
  },
  {
    id: "three-battery-mapping",
    field: "SPORTEQ THREE / THREE+ battery-to-price mapping",
    issue: "One outlet mapped THREE to 70 kWh and 79 kWh, contradicting the official release.",
    positions: [
      { claim: "THREE = 59 or 70 kWh; THREE+ = 70 or 79 kWh", sourceId: "mahindra-brochure" },
      { claim: "THREE = 70 kWh / 79 kWh", sourceId: "businesstoday-sporteq" },
    ],
    handling: "Brochure and press release agree. The outlet's mapping is an error.",
    resolved: "Settled by the brochure specification table.",
  },
  {
    id: "launch-edition-paint",
    field: "SPORTEQ Launch Edition paint name",
    issue: "Reported as both 'Graphite Storm' and 'Graphite Stone'.",
    positions: [{ claim: "Graphite Storm", sourceId: "mahindra-brochure" }],
    handling: "Published as Graphite Storm.",
    resolved:
      "Settled by the brochure colour page and the configurator. Note Mahindra's own asset filenames still call it GalaxyGrey, which is legacy naming.",
  },
  {
    id: "ac-charge-70",
    field: "AC charging time, 70 kWh pack",
    issue: "AC charge times were published for the 59 and 79 kWh packs but not, initially, for the 70 kWh pack.",
    positions: [{ claim: "7 h at 11.2 kW / 10.2 h at 7.2 kW", sourceId: "mahindra-brochure" }],
    handling: "Published from the brochure specification table.",
    resolved: "Settled by the brochure. All three packs now have official AC charge times.",
  },
  {
    id: "colour-list",
    field: "Colour palette composition",
    issue:
      "Media colour lists gave twelve finishes including a 'Desert Myst Satin' and omitted a satin black. That composition was wrong.",
    positions: [
      {
        claim: "Satin finishes are Everest White, Firestorm Orange, Stealth Black and Rosso Impulso — all Formula E Freedom Edition",
        sourceId: "mahindra-brochure",
      },
      { claim: "Desert Myst Satin", sourceId: "wikipedia-be6" },
    ],
    handling: "Rebuilt from the brochure and the configurator, with Mahindra's own colour codes and hex values.",
    resolved:
      "Settled. There is no Desert Myst Satin. The satin finishes belong to the Formula E Freedom Edition, and Graphite Storm is Launch Edition only.",
  },
  {
    id: "wheel-sizes",
    field: "Wheel size by variant",
    issue:
      "We had published 19-inch alloys across the standard variants, which was taken from launch coverage and was wrong for the two entry variants.",
    positions: [
      { claim: "ONE: R18 aero covers · TWO: R19 stylised with aero covers · THREE upward: R19 alloys · FE: R20", sourceId: "mahindra-brochure" },
      { claim: "19-inch dual-tone alloys on standard variants", sourceId: "autocar-sporteq" },
    ],
    handling: "Corrected from the brochure specification table.",
    resolved: "Settled by the brochure. Wheel size is now shown per variant in the configurator.",
  },
];

export const OPEN_FLAGS = REVIEW_FLAGS.filter((f) => !f.resolved);
export const RESOLVED_FLAGS = REVIEW_FLAGS.filter((f) => f.resolved);
