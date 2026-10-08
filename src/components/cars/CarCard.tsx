import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { emiFrom, km as fmtKm, lakh } from "@/lib/format";
import type { Car } from "@/lib/data/cars";

export function CarCard({ car, sizes = "(min-width:1024px) 33vw, (min-width:640px) 50vw, 86vw" }: { car: Car; sizes?: string }) {
  return (
    <article className="card card-hover flex h-full flex-col">
      <Link href={`/cars/${car.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-graphite">
        <Photo media={car.images[0]} sizes={sizes} className="zoom" />
        <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/10 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {car.verified && (
            <span className="verified">
              <Icon name="shield" size={11} />
              Verified
            </span>
          )}
          {car.condition === "Modified" && (
            <span className="chip border-gold/40 bg-gold/12 text-gold">Modified</span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ash">
              {car.year} · {car.brand}
            </p>
            <h3 className="mt-0.5 font-display text-xl font-extrabold uppercase leading-none tracking-[-0.02em]">
              {car.model}
            </h3>
          </div>
          {car.hasVideo && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ash">
              <Icon name="play" size={11} /> {car.photoCount}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-ash">{car.variant}</p>

        <p className="mt-3 font-display text-2xl font-extrabold tracking-[-0.03em] tnum">
          {lakh(car.price)}
        </p>
        {car.financing && (
          <p className="mt-1 text-[11px] text-dim tnum">
            EMI from {emiFrom(car.price)} · finance available
          </p>
        )}

        <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-ash tnum">
          <li>{fmtKm(car.km)}</li>
          <li className="text-dim">·</li>
          <li>{car.fuel}</li>
          <li className="text-dim">·</li>
          <li>{car.transmission}</li>
          <li className="text-dim">·</li>
          <li>{car.owner}</li>
        </ul>

        <p className="mt-2 flex items-center gap-1 text-[11px] text-dim">
          <Icon name="map" size={12} />
          {car.city}
        </p>

        <Link href={`/cars/${car.slug}`} className="btn btn-outline btn-sm btn-block mt-4">
          View car
          <Icon name="arrow" size={14} />
        </Link>
      </div>
    </article>
  );
}
