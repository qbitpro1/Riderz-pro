/**
 * SPEAKER SIZE, read from what the product says about itself.
 *
 * The catalogue has no size field, so the size is read from the title and the part code
 * ("6.5\" Component Set", "6x9-Inch Coaxial", "Level-3 Series 5.25\""). A product that does not
 * state one of the standard sizes gets null and is never guessed into a size filter.
 */

export const SPEAKER_SIZES = ["6.5", "6x9", "5.25", "4"] as const;
export type SpeakerSize = (typeof SPEAKER_SIZES)[number];

export const SPEAKER_SIZE_LABELS: Record<SpeakerSize, string> = {
  "6.5": '6.5"',
  "6x9": '6×9"',
  "5.25": '5.25"',
  "4": '4"',
};

const INCH = String.raw`\s*(?:"|''|”|-?\s*inch(?:es)?\b|-?\s*in\b)`;

/** Order matters: 6x9 before 6.5 / 4 so "6x9" never reads as a 9" or 6" speaker. */
const PATTERNS: [SpeakerSize, RegExp][] = [
  ["6x9", /\b6\s*[x×]\s*9\b/i],
  ["6.5", new RegExp(String.raw`\b6\.5${INCH}|\b165\s?mm\b`, "i")],
  ["5.25", new RegExp(String.raw`\b5\.25${INCH}|\b13[03]\s?mm\b`, "i")],
  ["4", new RegExp(String.raw`(?<![\d.])4${INCH}|\b10[02]\s?mm\b`, "i")],
];

export function speakerSize(text: string): SpeakerSize | null {
  for (const [size, re] of PATTERNS) if (re.test(text)) return size;
  return null;
}

/** The size of a catalogue item, from its title and code. */
export const itemSpeakerSize = (item: { title: string; code: string | null }): SpeakerSize | null =>
  speakerSize(`${item.title} ${item.code ?? ""}`);

export const isSpeakerSize = (v: string): v is SpeakerSize => (SPEAKER_SIZES as readonly string[]).includes(v);
