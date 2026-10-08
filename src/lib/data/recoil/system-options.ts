/**
 * The choices offered by "Build my audio system" — goals and budgets only.
 * Split from `./system-builder` so the form can import them without pulling
 * the RECOIL catalogue into the browser.
 */

export type Goal =
  | "clarity"
  | "bass"
  | "loud"
  | "premium"
  | "audiophile"
  | "spl"
  | "oem-plus";

export type Budget = 10000 | 25000 | 50000 | 100000 | 200000;

export const BUDGETS: { value: Budget; label: string }[] = [
  { value: 10000, label: "₹10,000" },
  { value: 25000, label: "₹25,000" },
  { value: 50000, label: "₹50,000" },
  { value: 100000, label: "₹1,00,000" },
  { value: 200000, label: "₹2,00,000+" },
];

export const GOALS: { value: Goal; label: string; blurb: string }[] = [
  { value: "clarity", label: "Better clarity", blurb: "Vocals and detail the factory speakers cannot resolve." },
  { value: "bass", label: "Strong bass", blurb: "Add the bottom two octaves your doors can't reach." },
  { value: "loud", label: "Loud system", blurb: "High output that stays clean at volume." },
  { value: "premium", label: "Premium sound", blurb: "Balanced, processed, properly staged." },
  { value: "audiophile", label: "Audiophile", blurb: "Accuracy first — measured and tuned." },
  { value: "spl", label: "SPL", blurb: "Competition-grade output. Not a daily-driver build." },
  { value: "oem-plus", label: "OEM+ upgrade", blurb: "Keep the factory head unit and dashboard exactly as they are." },
];
