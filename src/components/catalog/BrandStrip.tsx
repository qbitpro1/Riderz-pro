import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { BRANDS, CATALOG_BY_BRAND } from "@/lib/catalog";

/**
 * "Shop by brand." Every brand card leads to its own brand page; the brands
 * that also run a standalone store carry a second link straight into it, so
 * neither route is hidden behind the other.
 */
export function BrandStrip({ exclude = [] as string[] }) {
  const brands = BRANDS.filter((b) => !exclude.includes(b.slug));

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {brands.map((b, i) => {
        const count = CATALOG_BY_BRAND[b.slug]?.length ?? 0;
        return (
          <li key={b.slug}>
            <Reveal delay={i * 55} className="h-full">
              <article className="card card-hover flex h-full flex-col">
                <Link href={`/brands/${b.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-graphite">
                  <Photo media={b.image} sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 92vw" className="zoom opacity-80" />
                  <div className="absolute inset-0 scrim-soft" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-display text-2xl font-extrabold uppercase leading-none tracking-[-0.03em]">
                      {b.name}
                    </p>
                    <p className="mt-1 text-[11px] text-accent">{b.position}</p>
                  </div>
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs leading-relaxed text-ash">{b.tagline}</p>
                  <div className="mt-auto pt-4">
                    <p className="text-[11px] text-dim tnum">
                      {b.state === "importing" ? "Catalogue import in progress" : `${count} products`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      <Link
                        href={`/brands/${b.slug}`}
                        className="inline-flex items-center gap-1 text-[11px] text-accent underline underline-offset-4"
                      >
                        Shop {b.name}
                        <Icon name="arrow" size={12} />
                      </Link>
                      {b.storeHref && (
                        <Link href={b.storeHref} className="text-[11px] text-ash underline underline-offset-4 hover:text-chalk">
                          {b.storeLabel}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}

/** Compact chip rail — used in search and under the shop hero. */
export function BrandChips({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {BRANDS.map((b) => (
        <Link key={b.slug} href={`/brands/${b.slug}`} className="chip hover:border-accent hover:text-accent">
          <Icon name="chevron" size={11} className="text-accent" />
          {b.name}
        </Link>
      ))}
    </div>
  );
}
