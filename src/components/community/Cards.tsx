import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Stars } from "@/components/ui/Section";
import { rupees } from "@/lib/format";
import type { Build, Review } from "@/lib/data/community";

export function BuildCard({
  build,
  sizes = "(min-width:1024px) 33vw, (min-width:640px) 50vw, 82vw",
}: {
  build: Build;
  sizes?: string;
}) {
  return (
    <article className="card card-hover group h-full">
      <Link href={`/builds/${build.slug}`} className="block">
        <div data-theme="dark" className="relative aspect-[4/5] overflow-hidden bg-graphite">
          <Photo media={build.image} sizes={sizes} className="zoom" />
          <div className="absolute inset-0 scrim" />

          <span className="absolute left-3 top-3 chip border-accent/35 bg-accent/12 text-accent">
            {build.tag}
          </span>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-display text-2xl font-extrabold uppercase leading-none tracking-[-0.03em]">
              {build.title}
            </h3>
            <p className="mt-1.5 text-xs text-ash">{build.vehicle}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {build.mods.slice(0, 3).map((m) => (
                <span key={m.group} className="chip">
                  {m.group}
                </span>
              ))}
              {build.mods.length > 3 && <span className="chip">+{build.mods.length - 3}</span>}
            </div>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-tint/12 pt-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-dim">Build cost</p>
                <p className="font-display text-lg font-extrabold tnum">{rupees(build.cost)}</p>
              </div>
              <span className="flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                See the build
                <Icon name="arrow" size={14} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="card flex h-full flex-col p-5">
      <Stars rating={review.rating} />
      <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-chalk/90">
        “{review.body}”
      </blockquote>
      <div className="mt-5 flex items-center gap-3 border-t border-tint/8 pt-4">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden bg-graphite">
          <Photo media={review.image} sizes="44px" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{review.name}</p>
          <p className="truncate text-[11px] text-dim">
            {review.vehicle} · {review.service}
          </p>
        </div>
        <span className="ml-auto shrink-0 text-[10px] uppercase tracking-[0.12em] text-dim">
          {review.city}
        </span>
      </div>
    </article>
  );
}
