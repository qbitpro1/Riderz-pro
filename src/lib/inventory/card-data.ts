import { attributionFor, displayableImages, verifiedBadgeAllowed } from "./compliance";
import { formatIST, priceChange, relativeAge } from "./freshness";
import type { Listing } from "./types";
import type { MediaKey } from "@/lib/media";

/**
 * Everything a card or a filter needs, resolved on the server.
 *
 * Compliance decisions — which images may be shown, whether the verified badge
 * applies, whether the source may be named — are made here, once, before the
 * data crosses into the browser. The client cannot re-derive them and cannot
 * accidentally show something it should not.
 */
export type CardData = {
  id: string;
  slug: string;
  title: string;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  price: number | null;
  km: number | null;
  fuel: string | null;
  transmission: string | null;
  owners: number | null;
  bodyType: string | null;
  drivetrain: string | null;
  city: string;
  locality: string | null;
  financeAvailable: boolean;

  image: { media?: MediaKey; url?: string; alt: string } | null;
  imagesUnavailableReason: string | null;

  verified: boolean;
  sourceLabel: string;
  priceDrop: { previous: number; delta: number } | null;
  listedAgo: string | null;
  verifiedAtLabel: string;
  discoveredAt: string;
  status: Listing["status"];
  demo: boolean;

  /** Free-text haystack for client-side matching. */
  haystack: string;
};

export function toCardData(l: Listing): CardData {
  const images = displayableImages(l);
  const hero = images[0];
  const drop = priceChange(l.priceHistory);

  return {
    id: l.id,
    slug: l.slug,
    title: [l.year, l.make, l.model, l.variant].filter(Boolean).join(" "),
    make: l.make,
    model: l.model,
    variant: l.variant,
    year: l.year,
    price: l.price,
    km: l.km,
    fuel: l.fuel,
    transmission: l.transmission,
    owners: l.owners,
    bodyType: l.bodyType,
    drivetrain: l.drivetrain,
    city: l.city,
    locality: l.locality,
    financeAvailable: l.financeAvailable,

    image: hero ? { media: hero.media, url: hero.url, alt: hero.alt } : null,
    imagesUnavailableReason: l.imagesUnavailableReason,

    verified: verifiedBadgeAllowed(l),
    sourceLabel: attributionFor(l).label,
    priceDrop: drop?.direction === "drop" ? { previous: drop.previous, delta: drop.delta } : null,
    listedAgo: relativeAge(l.listedAt ?? l.discoveredAt),
    verifiedAtLabel: formatIST(l.lastVerifiedAt),
    discoveredAt: l.discoveredAt,
    status: l.status,
    demo: l.demo,

    haystack: [
      l.make,
      l.model,
      l.variant,
      l.bodyType,
      l.city,
      l.locality,
      l.colour,
      l.fuel,
      l.transmission,
      l.drivetrain,
      ...(l.modifications ?? []).map((m) => `${m.name} ${m.value}`),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
}
