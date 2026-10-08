import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import type { MediaKey } from "@/lib/media";

/**
 * The alternating image / copy band used for each Riderzpro studio on the
 * homepage. One component, six sections, consistent rhythm.
 */
export function Studio({
  eyebrow,
  title,
  blurb,
  points,
  media,
  href,
  cta,
  secondary,
  flip = false,
  priceNote,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
  points: string[];
  media: MediaKey;
  href: string;
  cta: string;
  secondary?: { href: string; label: string };
  flip?: boolean;
  priceNote?: string;
}) {
  return (
    <section className="section">
      <div className="shell grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal className={flip ? "lg:order-2" : ""}>
          <Link href={href} className="group relative block aspect-[4/3] overflow-hidden bg-graphite md:aspect-[3/2]">
            <Photo media={media} sizes="(min-width:1024px) 50vw, 100vw" className="zoom" />
            <div className="absolute inset-0 bg-gradient-to-t from-void/80 via-void/10 to-transparent" />
            <span className="absolute bottom-4 left-4 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-chalk">
              <span className="h-1.5 w-1.5 bg-accent pulse-dot" />
              {eyebrow}
            </span>
          </Link>
        </Reveal>

        <Reveal delay={90} className={flip ? "lg:order-1" : ""}>
          <p className="eyebrow mb-3">{eyebrow}</p>
          <h2 className="display-2">{title}</h2>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-ash md:text-base">{blurb}</p>

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-chalk/85">
                <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                {p}
              </li>
            ))}
          </ul>

          {priceNote && <p className="mt-5 text-sm text-dim">{priceNote}</p>}

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={href} className="btn btn-primary">
              {cta}
              <Icon name="arrow" size={15} />
            </Link>
            {secondary && (
              <Link href={secondary.href} className="btn btn-outline">
                {secondary.label}
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
