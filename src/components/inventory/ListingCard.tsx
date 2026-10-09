import Image from "next/image";
import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { emiFrom, km as fmtKm, lakh, rupees } from "@/lib/format";
import type { CardData } from "@/lib/inventory/card-data";

/**
 * Renders purely from `CardData`, which already carries the compliance
 * decisions. Safe on both sides of the server/client boundary.
 */
export function ListingCard({
  listing,
  sizes = "(min-width:1024px) 33vw, (min-width:640px) 50vw, 86vw",
}: {
  listing: CardData;
  sizes?: string;
}) {
  return (
    <article className="card card-hover flex h-full flex-col">
      <Link href={`/cars/${listing.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-graphite">
        {listing.image ? (
          listing.image.media ? (
            <Photo media={listing.image.media} sizes={sizes} className="zoom" alt={listing.image.alt} />
          ) : (
            <Image src={listing.image.url!} alt={listing.image.alt} fill sizes={sizes} className="zoom object-cover" />
          )
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <Icon name="car" size={26} className="text-dim" />
            <span className="text-[10px] uppercase leading-relaxed tracking-[0.12em] text-dim">
              {listing.imagesUnavailableReason ?? "Photos unavailable — contact Riderzpro"}
            </span>
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/10 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {listing.verified ? (
            <span className="verified">
              <Icon name="shield" size={11} />
              Riderzpro Verified
            </span>
          ) : (
            <span className="chip border-tint/20 bg-void/70">{listing.sourceLabel}</span>
          )}
          {listing.priceDrop && <span className="chip border-accent/40 bg-accent/15 text-accent">Price drop</span>}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ash">
            {listing.year} · {listing.make}
          </p>
          <h3 className="mt-0.5 font-display text-xl font-extrabold uppercase leading-none tracking-[-0.02em]">
            {listing.model}
          </h3>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {listing.variant && <p className="text-xs text-ash">{listing.variant}</p>}

        <div className="mt-3">
          {listing.price != null ? (
            <>
              {listing.priceDrop && <p className="text-xs text-dim line-through tnum">{lakh(listing.priceDrop.previous)}</p>}
              <p className="font-display text-2xl font-extrabold tracking-[-0.03em] tnum">{lakh(listing.price)}</p>
              {listing.priceDrop && (
                <p className="text-[11px] text-accent tnum">{rupees(listing.priceDrop.delta)} price drop</p>
              )}
            </>
          ) : (
            <p className="font-display text-lg uppercase text-ash">Price on request</p>
          )}
          {listing.financeAvailable && listing.price != null && (
            <p className="mt-1 text-[11px] text-dim tnum">Estimated EMI from {emiFrom(listing.price)}</p>
          )}
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-ash tnum">
          <li>{listing.km != null ? fmtKm(listing.km) : "km not specified"}</li>
          <li className="text-dim">·</li>
          <li>{listing.fuel ?? "Fuel not specified"}</li>
          <li className="text-dim">·</li>
          <li>{listing.transmission ?? "Transmission not specified"}</li>
          {listing.owners != null && (
            <>
              <li className="text-dim">·</li>
              <li>{ordinalOwner(listing.owners)}</li>
            </>
          )}
        </ul>

        <p className="mt-2 flex items-center gap-1 text-[11px] text-dim">
          <Icon name="map" size={12} />
          {[listing.locality, listing.city].filter(Boolean).join(", ")}
        </p>

        <p className="mt-2 text-[10px] leading-relaxed text-dim">
          {listing.listedAgo ? `Listed ${listing.listedAgo} · ` : ""}
          Source verified {listing.verifiedAtLabel}
        </p>

        <Link href={`/cars/${listing.slug}`} className="btn btn-outline btn-sm btn-block mt-4">
          View car
          <Icon name="arrow" size={14} />
        </Link>
      </div>
    </article>
  );
}

function ordinalOwner(n: number): string {
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${suffix} owner`;
}
