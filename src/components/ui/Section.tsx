import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

export function SectionHead({
  eyebrow,
  title,
  blurb,
  href,
  hrefLabel = "View all",
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  blurb?: string;
  href?: string;
  hrefLabel?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal className={`mb-7 md:mb-10 ${align === "center" ? "text-center" : ""}`}>
      <div className="flex items-end justify-between gap-6">
        <div className={align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}>
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h2 className="display-2">{title}</h2>
          {blurb && <p className="mt-3 text-sm leading-relaxed text-ash md:text-base">{blurb}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="hidden shrink-0 items-center gap-2 border-b border-tint/20 pb-1 font-display text-xs font-bold uppercase tracking-[0.16em] text-chalk transition-colors hover:border-accent hover:text-accent md:inline-flex"
          >
            {hrefLabel}
            <Icon name="arrow" size={15} />
          </Link>
        )}
      </div>
    </Reveal>
  );
}

export function SectionFootLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-6 inline-flex items-center gap-2 border-b border-tint/20 pb-1 font-display text-xs font-bold uppercase tracking-[0.16em] text-chalk transition-colors hover:border-accent hover:text-accent md:hidden"
    >
      {label}
      <Icon name="arrow" size={15} />
    </Link>
  );
}

export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-accent" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="star"
          size={size}
          className={i <= Math.round(rating) ? "opacity-100" : "opacity-25"}
        />
      ))}
    </span>
  );
}

export function Divider() {
  return <div className="hairline" />;
}
