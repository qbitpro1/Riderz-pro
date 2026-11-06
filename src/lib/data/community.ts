import type { MediaKey } from "@/lib/media";

export type Build = {
  slug: string;
  title: string;
  vehicle: string;
  owner: string;
  city: string;
  cost: number;
  weeks: number;
  brief: string;
  image: MediaKey;
  gallery: MediaKey[];
  mods: { group: string; items: string[] }[];
  shop: string[];
  tag: "Off-Road" | "Street" | "Audio" | "Luxury" | "Performance";
};

/** Customer builds. Empty until real, consented customer projects are added (the earlier entries were demo content). */
export const BUILDS: Build[] = [];

export function getBuild(slug: string): Build | undefined {
  return BUILDS.find((b) => b.slug === slug);
}

export type Review = {
  name: string;
  vehicle: string;
  service: string;
  rating: number;
  city: string;
  date: string;
  body: string;
  image: MediaKey;
};

/** Customer reviews. Empty until real reviews are collected (the earlier entries were demo content). */
export const REVIEWS: Review[] = [];

/** Headline figures. Empty until real, verifiable numbers are available (the earlier figures were demo content). */
export const STATS: { value: string; label: string }[] = [];
