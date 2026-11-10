/**
 * Build showcase: the shape only. Builds are in the database (builds), added by the team in
 * /admin/builds; read them with src/lib/server/builds.ts. Customer reviews and the site's headline
 * numbers are in the database too (src/lib/server/reviews.ts).
 */

export const BUILD_TAGS = ["Off-Road", "Street", "Audio", "Luxury", "Performance"] as const;
export type BuildTag = (typeof BUILD_TAGS)[number];

export type Build = {
  id: string;
  slug: string;
  status: "draft" | "live" | "archived";
  title: string;
  vehicle: string;
  owner: string | null;
  city: string | null;
  /** Rupees, parts + labour + GST as invoiced; null when the owner prefers it private. */
  cost: number | null;
  weeks: number | null;
  brief: string;
  tag: BuildTag;
  mods: { group: string; items: string[] }[];
  /** Product slugs to shop the build. */
  shop: string[];
  /** Uploaded photo URLs, first is the cover. */
  photos: string[];
  photoIds: string[];
};
