/**
 * Data model behind BUILD YOUR CAR.
 *
 * Prices are installed prices in rupees and deliberately shown as estimates —
 * the final quote comes back from the workshop once fitment is confirmed.
 */

export type BuildOption = {
  slug: string;
  name: string;
  price: number;
  note?: string;
  /** Restrict an option to specific platforms; empty means everything. */
  only?: string[];
};

export type BuildStage = {
  slug: string;
  name: string;
  caption: string;
  options: BuildOption[];
};

export const BUILD_STAGES: BuildStage[] = [
  {
    slug: "exterior",
    name: "EXTERIOR",
    caption: "Bumpers, kits, lighting and everything bolted to the outside.",
    options: [
      { slug: "body-kit", name: "Full body kit", price: 1_25_000 },
      { slug: "front-bumper", name: "Front bumper conversion", price: 42_000 },
      { slug: "rear-bumper", name: "Rear bumper conversion", price: 38_000 },
      { slug: "side-skirts", name: "Side skirts", price: 18_000 },
      { slug: "spoiler", name: "Roof spoiler, painted", price: 8400 },
      { slug: "grille", name: "Grille conversion", price: 16_500 },
      { slug: "bonnet", name: "Bonnet with scoop", price: 34_000 },
      { slug: "fender", name: "Wide fender flares", price: 46_000 },
      { slug: "wheel-arches", name: "Wheel arch cladding", price: 14_000 },
      { slug: "led-headlamp", name: "Bi-LED projector headlamps", price: 22_400 },
      { slug: "drl", name: "Sequential DRL strips", price: 4999 },
      { slug: "tail-lamp", name: "LED tail lamp conversion", price: 26_000 },
      { slug: "fog-lamps", name: "Projector fog lamps", price: 7100 },
      { slug: "roof-rails", name: "Aero roof rails", price: 10_400 },
      { slug: "roof-rack", name: "Platform roof rack", price: 50_400, only: ["off-road"] },
    ],
  },
  {
    slug: "wheels",
    name: "WHEELS & TYRES",
    caption: "The single change that alters a car's stance the most.",
    options: [
      { slug: "alloys-17", name: "17\" flow-formed alloys", price: 58_000 },
      { slug: "alloys-18", name: "18\" forged alloys", price: 1_24_000 },
      { slug: "steel-offroad", name: "16\" off-road steel wheels", price: 26_000, only: ["off-road"] },
      { slug: "performance-tyres", name: "Performance tyre set", price: 52_000 },
      { slug: "at-tyres", name: "All-terrain tyre set", price: 48_000 },
      { slug: "mt-tyres", name: "Mud-terrain tyre set", price: 62_000, only: ["off-road"] },
      { slug: "spacers", name: "Hub-centric spacers", price: 9800 },
      { slug: "lift-kit", name: "2-inch progressive lift kit", price: 66_900, only: ["off-road"] },
      { slug: "lowering", name: "Adjustable coilovers", price: 82_900 },
    ],
  },
  {
    slug: "interior",
    name: "INTERIOR",
    caption: "Where you spend every minute of ownership.",
    options: [
      { slug: "custom-seats", name: "Custom seat rebuild", price: 89_000 },
      { slug: "leather", name: "Full leather interior", price: 1_45_000 },
      { slug: "ambient", name: "64-colour ambient lighting", price: 11_400 },
      { slug: "steering-cover", name: "Nappa steering cover", price: 899 },
      { slug: "steering-custom", name: "Custom steering wheel", price: 24_000 },
      { slug: "mats", name: "9D floor mat set", price: 4499 },
      { slug: "door-panels", name: "Custom door panels", price: 72_000 },
      { slug: "roof-lining", name: "Alcantara roof lining", price: 34_000 },
      { slug: "dashboard", name: "Dashboard customisation", price: 88_000 },
      { slug: "recliner", name: "Electric recliner seats", price: 2_45_000 },
      { slug: "footrest", name: "Automatic footrest", price: 38_000 },
      { slug: "captain", name: "Captain seat conversion", price: 1_25_000 },
      { slug: "luxury-suv", name: "Luxury SUV lounge conversion", price: 6_50_000 },
    ],
  },
  {
    slug: "audio",
    name: "AUDIO",
    caption: "Sound. Power. Control. Tuned in our room, not guessed at.",
    options: [
      { slug: "component", name: "Component front stage", price: 25_400 },
      { slug: "coaxial", name: "Coaxial speaker set", price: 8900 },
      { slug: "midrange", name: "Dedicated midrange drivers", price: 14_900 },
      { slug: "tweeters", name: "Silk dome tweeters", price: 8900 },
      { slug: "subwoofer", name: "Under-seat active subwoofer", price: 20_400 },
      { slug: "amplifier", name: "4-channel amplifier", price: 21_900 },
      { slug: "dsp", name: "8-channel DSP amplifier", price: 51_400 },
      { slug: "deadening", name: "Four-door sound deadening", price: 16_400 },
      { slug: "android", name: "12.3\" Android head unit", price: 32_400 },
      { slug: "infotainment", name: "Premium infotainment upgrade", price: 68_000 },
      { slug: "custom-audio", name: "Custom fibreglass audio build", price: 1_85_000 },
    ],
  },
  {
    slug: "performance",
    name: "PERFORMANCE",
    caption: "Power is easy. Making it usable and legal is the work.",
    options: [
      { slug: "intake", name: "Cold air intake", price: 21_400 },
      { slug: "exhaust", name: "Cat-back stainless exhaust", price: 54_400 },
      { slug: "remap", name: "Stage 1 ECU remap", price: 34_900 },
      { slug: "filter", name: "High-flow drop-in filter", price: 3499 },
      { slug: "intercooler", name: "Upgraded intercooler", price: 68_000 },
      { slug: "turbo", name: "Turbo upgrade", price: 2_45_000 },
      { slug: "cooling", name: "Cooling package", price: 42_000 },
      { slug: "suspension", name: "Performance suspension", price: 74_900 },
      { slug: "brakes", name: "4-pot big brake kit", price: 98_900 },
    ],
  },
];

/** Presets give first-time users a credible starting point in one tap. */
export const BUILD_PRESETS = [
  {
    slug: "street",
    name: "STREET PACK",
    blurb: "Stance, lighting and sound. The most-ordered build in the country.",
    selections: ["alloys-17", "led-headlamp", "drl", "component", "amplifier", "deadening", "mats"],
  },
  {
    slug: "trail",
    name: "TRAIL PACK",
    blurb: "Lift, rubber, protection and light. Built to leave the tarmac.",
    selections: ["lift-kit", "at-tyres", "steel-offroad", "roof-rack", "fender", "fog-lamps"],
  },
  {
    slug: "lounge",
    name: "LOUNGE PACK",
    blurb: "Turn the second row into the best seat in the car.",
    selections: ["leather", "ambient", "captain", "footrest", "roof-lining", "dsp", "infotainment"],
  },
  {
    slug: "power",
    name: "POWER PACK",
    blurb: "Torque you can feel, brakes that can stop it.",
    selections: ["remap", "intake", "exhaust", "brakes", "suspension", "performance-tyres"],
  },
];

export const INSTALLATION_RATE = 0.08; // workshop labour, applied to parts subtotal
export const GST_RATE = 0.18;
