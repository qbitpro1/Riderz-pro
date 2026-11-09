import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { SITE } from "@/lib/data/site";
import { DEPARTMENT_MENUS, PARTNERS_NAV, SHOP_BY_LINKS } from "@/lib/data/nav";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: DEPARTMENT_MENUS.map((d) => ({ label: d.label, href: d.href })),
  },
  { title: "Shop by", links: SHOP_BY_LINKS },
  { title: "Partners", links: [...PARTNERS_NAV.links, { label: "Offline Store login", href: "/vendor/offline-store" }] },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Track Order", href: "/track-order" },
      { label: "Shipping", href: "/support/shipping" },
      { label: "Returns", href: "/support/returns" },
      { label: "Warranty", href: "/support/warranty" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-px border-t border-tint/8 bg-carbon">
      {/* Below lg the bottom nav (64px) and any sticky action bar (--sticky-bar-h) overlay the page end. */}
      <div className="shell py-12 max-lg:pb-[calc(3rem+64px+var(--sticky-bar-h,0px)+env(safe-area-inset-bottom))] md:py-16 max-lg:md:pb-[calc(4rem+64px+var(--sticky-bar-h,0px)+env(safe-area-inset-bottom))]">
        <div className="grid gap-10 lg:grid-cols-[1fr_2.6fr]">
          <div>
            <Logo className="h-28" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ash">
              Car accessories from verified sellers across India, with secure checkout and order
              tracking.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={SITE.phoneHref} className="btn btn-outline btn-sm">
                <Icon name="phone" size={14} />
                {SITE.phone}
              </a>
            </div>

            <div className="mt-6 flex gap-3">
              <Social href={SITE.instagram} icon="instagram" label="Instagram" />
              <Social href={SITE.youtube} icon="youtube" label="YouTube" />
              <Social href={SITE.facebook} icon="facebook" label="Facebook" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="mb-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-dim">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-ash transition-colors hover:text-accent">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-tint/8 pt-6 text-xs text-dim md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.legalName} {SITE.name}® is a registered trademark of{" "}
            {SITE.legalName} All rights reserved.
          </p>
          <p>Modifications are carried out in line with the Central Motor Vehicles Rules. GSTIN {SITE.gstin}.</p>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, icon, label }: { href: string; icon: "instagram" | "youtube" | "facebook" | "map"; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      className="grid h-10 w-10 place-items-center border border-tint/12 text-ash transition-colors hover:border-accent hover:text-accent"
    >
      <Icon name={icon} size={18} />
    </a>
  );
}
