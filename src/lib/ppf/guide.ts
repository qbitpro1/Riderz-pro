/**
 * PPF GUIDE
 *
 * Written to answer the question, not to rank for it. Where a claim depends on
 * a specific film, it says so and points at that film's warranty rather than
 * making a blanket promise.
 */

export type GuideArticle = {
  slug: string;
  title: string;
  question: string;
  summary: string;
  body: { heading?: string; text: string }[];
  related: string[];
};

export const GUIDE: GuideArticle[] = [
  {
    slug: "what-is-ppf",
    title: "What is PPF?",
    question: "What actually is paint protection film?",
    summary:
      "A transparent urethane film applied over painted panels. It takes the impact instead of your paint.",
    body: [
      {
        text: "Paint protection film is a clear thermoplastic urethane layer bonded to the outside of a painted panel. Anything that would have hit the paint hits the film first — stone chips on the motorway, grit off a trail, a fingernail in the door handle cup, a supermarket trolley.",
      },
      {
        heading: "What it helps against",
        text: "Stone chips, minor scratches and abrasions, road debris, insect residue, bird droppings, road grime and general environmental contamination. Films with a self-healing top coat recover light marks with heat; whether a given film does that is a per-product specification, not a general property of PPF.",
      },
      {
        heading: "What it does not do",
        text: "It is not armour. A hard impact, a kerbed bumper or a car park dent will still damage the panel underneath. Nobody should sell you PPF as making a car damage-proof, and we do not.",
      },
    ],
    related: ["ppf-vs-ceramic", "is-ppf-worth-it", "does-ppf-damage-paint"],
  },
  {
    slug: "ppf-vs-ceramic",
    title: "PPF vs ceramic coating",
    question: "Should I get PPF or a ceramic coating?",
    summary:
      "They solve different problems. Film is physical armour; coating is a chemical surface layer. Most owners eventually want both.",
    body: [
      {
        text: "Paint protection film is a physical barrier with real thickness. It absorbs impact. A ceramic coating is a chemical layer measured in microns that changes how the surface behaves — water sheets off, dirt releases more easily, washing takes less time.",
      },
      {
        heading: "A coating is not a substitute for film",
        text: "A ceramic coating will not stop a stone chip. Anyone telling you it will is selling you the cheaper product. If your concern is the front end of a car that does highway miles, that is a film problem.",
      },
      {
        heading: "Together",
        text: "The usual answer is film on the panels that get hit, and a coating over the whole car including the film. You get impact protection where it matters and easier cleaning everywhere.",
      },
    ],
    related: ["what-is-ppf", "ppf-vs-vinyl-wrap", "ppf-maintenance"],
  },
  {
    slug: "ppf-vs-vinyl-wrap",
    title: "PPF vs vinyl wrap",
    question: "Is PPF the same as a wrap?",
    summary: "No. Wrap changes how the car looks. Film protects what is underneath. Coloured PPF does both.",
    body: [
      {
        text: "A vinyl wrap is a styling product — colour, finish, graphics. It is thinner than protection film and is not built to absorb impact. Paint protection film is a thicker urethane engineered to take a hit and, on many products, to self-heal light marks.",
      },
      {
        heading: "Coloured PPF",
        text: "Some manufacturers make coloured protection film, which changes the colour and protects the paint in one layer. It costs more than vinyl and does a different job. Availability and shade range move around, so ask before you set your heart on a colour.",
      },
    ],
    related: ["what-is-ppf", "gloss-vs-matte-ppf"],
  },
  {
    slug: "how-long-does-ppf-last",
    title: "How long does PPF last?",
    question: "How long will it last on my car?",
    summary:
      "Published warranties on the films we install run from five to ten years. Real life depends on how the car is used and washed.",
    body: [
      {
        text: "Each film carries its own manufacturer warranty period, and those are the only durability numbers we quote. On the XPEL products listed on this site, published warranties range from five years on the entry film to ten years on the Ultimate range — with one product extending cover to oxidation and gloss loss provided it is inspected annually.",
      },
      {
        heading: "What actually shortens it",
        text: "Pressure-washing close to an edge, automatic brush washes, aggressive solvents and leaving bird droppings to bake in the sun. None of that is covered by any warranty on the market.",
      },
      {
        heading: "Warranty is not lifespan",
        text: "A warranty covers manufacturing defects — yellowing, cracking, blistering, delaminating. It does not cover the film wearing out from use, and no film is warranted against stone impact damage.",
      },
    ],
    related: ["ppf-warranty", "ppf-maintenance", "how-to-wash-ppf"],
  },
  {
    slug: "does-ppf-damage-paint",
    title: "Does PPF damage paint?",
    question: "Will it wreck my paint when it comes off?",
    summary:
      "On sound factory paint, removal by a competent installer is normally uneventful. On resprayed or already-failing paint, it is not guaranteed.",
    body: [
      {
        text: "Film is designed to be removable. On original, properly cured factory paint, a professional removal usually leaves the panel as it was, with adhesive residue cleaned off.",
      },
      {
        heading: "Where it goes wrong",
        text: "Aftermarket respray that has not fully cured, paint with existing adhesion problems, or a cheap film left far past its life and gone brittle. In those cases removal can lift paint, and no honest installer will promise otherwise — including us.",
      },
      {
        heading: "What we do about it",
        text: "We inspect and read paint thickness before quoting a removal, and tell you what we find. If there is a risk on a particular panel, you hear it before we start, not after.",
      },
    ],
    related: ["ppf-removal", "ppf-warranty"],
  },
  {
    slug: "is-ppf-worth-it",
    title: "Is PPF worth it?",
    question: "Is it worth the money on a mid-range car?",
    summary: "It depends on the panels you protect and the miles you do — not on what the car cost.",
    body: [
      {
        text: "The argument for film is strongest on the front end of a car that does highway miles, and on the high-impact areas of any car that lives in a city. A front bumper respray costs real money and permanently marks the car as repaired.",
      },
      {
        heading: "Start small",
        text: "You do not have to do the whole car. Door cups, door edges, the boot loading edge and mirrors is a modest job that removes most of the damage a car picks up in ordinary use. Plenty of our customers start there and add the front end later.",
      },
      {
        heading: "When it is not worth it",
        text: "If the paint is already heavily marked, film locks that in. Correct first or spend the money on correction instead — we will tell you which, and we would rather do the cheaper job well.",
      },
    ],
    related: ["what-is-ppf", "full-body-vs-full-front", "ppf-for-suvs"],
  },
  {
    slug: "gloss-vs-matte-ppf",
    title: "Gloss vs matte PPF",
    question: "Which finish should I choose?",
    summary: "Gloss keeps the car looking as it does now. Matte and satin change its character, reversibly.",
    body: [
      {
        text: "Gloss film is optically clear — installed properly, the car looks unchanged and the paint keeps its depth. It is what most owners want, and it hides small installation imperfections better than any other finish.",
      },
      {
        heading: "Matte and satin",
        text: "These change a gloss car to a flat or soft-sheen finish while protecting the paint underneath. The original colour is untouched and the change is reversible, which is the whole appeal versus a respray.",
      },
      {
        heading: "The catch",
        text: "Matte and satin show installation errors far more than gloss, and they cannot be polished. Panel preparation has to be better, not worse, and the maintenance rules are stricter.",
      },
    ],
    related: ["ppf-vs-vinyl-wrap", "ppf-maintenance"],
  },
  {
    slug: "full-body-vs-full-front",
    title: "Full body vs full front",
    question: "Do I need the whole car done?",
    summary: "Full front covers where the damage actually happens. Full body covers everything, at roughly three times the film.",
    body: [
      {
        text: "Most stone damage lands on the front bumper, bonnet and front fenders. A full front package covers those with no visible film line across the middle of the bonnet, which is what separates it from a partial front.",
      },
      {
        heading: "When full body earns its money",
        text: "Cars with soft or expensive paint, cars that will be resold into a demanding market, cars doing long distances on gravel or trails, and any car where a single panel respray costs more than the film did.",
      },
      {
        heading: "The middle ground",
        text: "Full front plus doors, rocker panels and rear quarters covers nearly everything gravel reaches on a trail vehicle for meaningfully less than a full body job.",
      },
    ],
    related: ["is-ppf-worth-it", "ppf-for-off-road-vehicles", "ppf-for-luxury-cars"],
  },
  {
    slug: "ppf-maintenance",
    title: "PPF maintenance",
    question: "How do I look after it?",
    summary: "Wash it like good paint, keep pressure away from edges, and deal with contamination quickly.",
    body: [
      {
        text: "Two-bucket hand wash with a pH-neutral shampoo. Dry with a clean microfibre. That is most of it.",
      },
      {
        heading: "Leave it alone for the first week",
        text: "Film needs time to settle. No washing for the first seven days, and small amounts of moisture or haze under the film in that period are normal and clear on their own.",
      },
      {
        heading: "Things that shorten its life",
        text: "Pressure-washing close to an edge can lift film. Automatic brush washes drag grit across it. Solvent-based cleaners, tar removers and polishes on matte film all cause problems. Bird droppings and insect residue should come off promptly rather than baking on.",
      },
      {
        heading: "Product-specific instructions win",
        text: "Where the film manufacturer publishes its own care instructions, those override this page. We hand them to you at collection.",
      },
    ],
    related: ["how-to-wash-ppf", "how-long-does-ppf-last"],
  },
  {
    slug: "how-to-wash-ppf",
    title: "How to wash a PPF-protected car",
    question: "What is the right way to wash it?",
    summary: "Hand wash, two buckets, pH-neutral shampoo, no pressure at the edges.",
    body: [
      {
        text: "Rinse loose grit off first. Wash top down with a clean mitt and a pH-neutral shampoo, rinsing the mitt between panels. Dry with a plush microfibre or filtered blower.",
      },
      {
        heading: "Pressure washers",
        text: "Usable, but keep the lance at least 30 cm from the panel and never aim it straight at a film edge or seam. That is how edges lift.",
      },
      {
        heading: "Avoid",
        text: "Automatic brush washes, alkaline traffic-film removers, solvent-based tar removers on matte or satin film, and any abrasive polish on a matte finish.",
      },
    ],
    related: ["ppf-maintenance"],
  },
  {
    slug: "ppf-for-suvs",
    title: "PPF for SUVs",
    question: "Is it different on a big SUV?",
    summary: "More area, more cost, and a few panels worth prioritising that sedan owners never think about.",
    body: [
      {
        text: "A full-size SUV carries roughly 40% more painted area than a hatchback, which is most of the price difference. Bumpers are larger and usually more sculpted, so they take longer to wrap without a visible edge.",
      },
      {
        heading: "Worth prioritising",
        text: "Rocker panels and lower doors — SUVs throw more stone spray onto their own flanks than a low car does. The boot loading edge as well, because SUV boots are used like vans.",
      },
    ],
    related: ["ppf-for-off-road-vehicles", "full-body-vs-full-front"],
  },
  {
    slug: "ppf-for-luxury-cars",
    title: "PPF for luxury cars",
    question: "What changes on a premium or exotic car?",
    summary: "More complex bodywork, softer paint, and trim that has to come off to wrap an edge properly.",
    body: [
      {
        text: "Premium and exotic bodywork carries deeper recesses and tighter radii, and doing it properly means removing badges, handles, lamps and sometimes bumpers. That labour is the reason a luxury full-body job is not priced like a Creta.",
      },
      {
        heading: "Paint hardness",
        text: "Several European manufacturers use comparatively soft clear coats that mark easily — an argument for film rather than against it, but also an argument for correcting properly before the film goes on.",
      },
      {
        heading: "Piano-black trim",
        text: "The single most scratch-prone surface on any modern premium car, and among the cheapest things to protect.",
      },
    ],
    related: ["full-body-vs-full-front", "ppf-warranty"],
  },
  {
    slug: "ppf-for-off-road-vehicles",
    title: "PPF for off-road vehicles",
    question: "Does film survive a trail?",
    summary: "It takes gravel and branch scuffs that would otherwise mark the paint. It does not make the car damage-proof.",
    body: [
      {
        text: "A trail vehicle meets stones, branches, dust, mud and gravel spray. Film handles the abrasive end of that well: the panels that would come back from Spiti covered in fine scratches come back protected instead.",
      },
      {
        heading: "Panels that matter",
        text: "Front bumper, bonnet, fenders, doors, rocker panels and rear quarters. Door edges too, because trail branches find them.",
      },
      {
        heading: "Being honest about it",
        text: "A rock strike at speed will still dent a panel, and a branch dragged hard down a door can cut through film. Film reduces damage; it does not eliminate it.",
      },
    ],
    related: ["ppf-for-suvs", "full-body-vs-full-front"],
  },
  {
    slug: "ppf-removal",
    title: "PPF removal",
    question: "Can old film be taken off?",
    summary: "Yes, with heat, patience and an adhesive clean-up. The paint underneath is the variable.",
    body: [
      {
        text: "Old film is warmed and lifted slowly, then the remaining adhesive is removed with an appropriate solvent and the panel is inspected and polished as needed.",
      },
      {
        heading: "What we check first",
        text: "Age and condition of the existing film, whether the panel is original paint or respray, and paint thickness readings. Brittle film on a respray is the case that needs the most care.",
      },
      {
        heading: "What we will not promise",
        text: "We do not guarantee the paint condition after removal, because it depends on paint we did not apply and film we did not install. We tell you what we find before we start.",
      },
    ],
    related: ["does-ppf-damage-paint"],
  },
  {
    slug: "ppf-warranty",
    title: "PPF warranty",
    question: "What is actually covered?",
    summary:
      "Manufacturing defects in the film, from the film manufacturer. Our installation is warranted separately by us.",
    body: [
      {
        text: "Every film we install carries its own manufacturer warranty, with its own period, conditions and exclusions. Those are published per product on this site, taken from the manufacturer's own warranty documentation — we do not summarise them into a single Riderzpro promise, because they genuinely differ.",
      },
      {
        heading: "Typically covered",
        text: "Yellowing, cracking, blistering and delaminating. One product in the range we list extends to oxidation, gloss loss, UV damage and fading, on condition of annual inspections.",
      },
      {
        heading: "Typically excluded",
        text: "Impact damage from rocks and debris, collision, vandalism, hail and flood, improper washing, water spots, stains and scratches, and any damage from not following the care instructions.",
      },
      {
        heading: "Transferability",
        text: "Some products transfer to the next owner with proof of the original installation date; others are explicitly non-transferable. If you plan to sell the car inside the warranty period, that difference is worth reading before you choose a film.",
      },
      {
        heading: "Our part",
        text: "Riderzpro warrants its own workmanship — lifting edges, contamination under film, alignment — for twelve months. That is separate from, and additional to, the manufacturer's warranty on the film itself.",
      },
    ],
    related: ["how-long-does-ppf-last", "ppf-maintenance"],
  },
];

export function getArticle(slug: string): GuideArticle | undefined {
  return GUIDE.find((a) => a.slug === slug);
}

/** The quality checklist, written as things we can actually stand behind. */
export const QUALITY_CHECKLIST = [
  { claim: "Panels washed, decontaminated and clayed before any film is cut", note: null },
  { claim: "Paint depth read and recorded per panel", note: null },
  { claim: "Plotter-cut patterns where the manufacturer publishes one for your car", note: null },
  { claim: "Edges wrapped where the panel allows it", note: "Some panels physically cannot be wrapped without removing trim; we tell you which before we start." },
  { claim: "Installed in a dust-controlled room, not on the forecourt", note: null },
  { claim: "48 hours indoors to settle before collection", note: null },
  { claim: "Final inspection with you present, under inspection lighting", note: null },
  {
    claim: "Minimal visible edges",
    note: "Not zero. On most cars a small number of edges are unavoidable, and we will show you where they are before we cut rather than after.",
  },
];

export const PREP_STEPS = [
  { n: "01", t: "Vehicle inspection", b: "Panel-by-panel walkaround with you, photographed." },
  { n: "02", t: "Wash", b: "Two-bucket hand wash, wheels and arches first." },
  { n: "03", t: "Decontamination", b: "Iron fallout, tar and clay treatment." },
  { n: "04", t: "Paint inspection", b: "Depth gauge readings recorded per panel under inspection lighting." },
  { n: "05", t: "Paint correction", b: "Only where needed — film locks in whatever is underneath it." },
  { n: "06", t: "Panel preparation", b: "Trim, badges and handles removed where an edge needs wrapping." },
  { n: "07", t: "Installation", b: "Plotter-cut panels applied in a dust-controlled room." },
  { n: "08", t: "Edge finishing", b: "Edges wrapped and tucked wherever the panel allows." },
  { n: "09", t: "Final inspection", b: "Walked with you under inspection lights before you pay." },
  { n: "10", t: "Delivery", b: "Aftercare sheet, warranty documentation and a 48-hour settling brief." },
];
