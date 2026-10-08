import Link from "next/link";
import type { ReactNode } from "react";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import type { MediaKey } from "@/lib/media";

export function PageHero({
  eyebrow,
  title,
  blurb,
  media,
  actions,
  size = "md",
  position,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  blurb?: string;
  media: MediaKey;
  actions?: { href: string; label: string; variant?: "primary" | "outline" | "accent"; external?: boolean }[];
  size?: "sm" | "md" | "lg";
  position?: string;
  children?: ReactNode;
}) {
  const pad =
    size === "lg" ? "pt-32 pb-16 md:pt-44 md:pb-24" : size === "sm" ? "pt-24 pb-10 md:pt-32 md:pb-14" : "pt-28 pb-14 md:pt-40 md:pb-20";

  return (
    <section className="relative overflow-hidden border-b border-white/8">
      <div className="absolute inset-0">
        <Photo media={media} sizes="100vw" priority quality={70} position={position} />
        <div className="absolute inset-0 scrim" />
        <div className="absolute inset-0 grid-lines opacity-30" />
      </div>

      <div className={`shell relative ${pad}`}>
        <p className="eyebrow mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-accent pulse-dot" />
          {eyebrow}
        </p>
        <h1 className="display-2 max-w-3xl">{title}</h1>
        {blurb && <p className="mt-4 max-w-xl text-sm leading-relaxed text-ash md:text-base">{blurb}</p>}

        {actions && actions.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-3">
            {actions.map((a) =>
              a.external ? (
                <a
                  key={a.label}
                  href={a.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`btn btn-${a.variant ?? "outline"}`}
                >
                  {a.label}
                </a>
              ) : (
                <Link key={a.label} href={a.href} className={`btn btn-${a.variant ?? "outline"}`}>
                  {a.label}
                  {a.variant === "primary" && <Icon name="arrow" size={15} />}
                </Link>
              ),
            )}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-dim">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-accent">
              {item.label}
            </Link>
          ) : (
            <span className="text-ash">{item.label}</span>
          )}
          {i < items.length - 1 && <Icon name="chevron" size={10} />}
        </span>
      ))}
    </nav>
  );
}
