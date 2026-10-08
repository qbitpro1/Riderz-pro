import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LOCATIONS, SITE, whatsapp } from "@/lib/data/site";
import { LANDING_MODELS } from "@/lib/data/vehicles";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Motorbotz",
    links: [
      { label: "Buy Cars", href: "/cars" },
      { label: "Sell Your Car", href: "/sell" },
      { label: "Shop Accessories", href: "/shop" },
      { label: "Build Your Car", href: "/build" },
      { label: "Motorbotz Builds", href: "/builds" },
    ],
  },
  {
    title: "Studios",
    links: [
      { label: "Premium Audio", href: "/audio" },
      { label: "RECOIL Catalogue", href: "/recoil" },
      { label: "Build My Audio System", href: "/build-audio" },
      { label: "PPF & Detailing", href: "/ppf" },
      { label: "Off-Road Garage", href: "/off-road" },
      { label: "Body Kits & Facelifts", href: "/body-kits" },
      { label: "Custom Interiors", href: "/interiors" },
      { label: "Performance Garage", href: "/performance" },
      { label: "Motorbotz Garage", href: "/garage" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Shipping", href: "/support/shipping" },
      { label: "Returns", href: "/support/returns" },
      { label: "Warranty", href: "/support/warranty" },
      { label: "Locations", href: "/locations" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Why Motorbotz", href: "/why-motorbotz" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-px border-t border-white/8 bg-carbon">
      <div className="shell py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2.4fr]">
          <div>
            <span className="flex items-baseline font-display text-3xl font-extrabold tracking-[-0.045em]">
              MOTOR<span className="text-accent">BOTZ</span>
            </span>
            <p className="mt-3 font-display text-sm font-bold uppercase tracking-[0.24em] text-ash">
              {SITE.tagline}
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ash">
              If it has wheels, Motorbotz can help you buy it, sell it, modify it, protect it,
              upgrade it or build it.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={whatsapp("Hi Motorbotz, I'd like to talk about my car.")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp btn-sm"
              >
                <Icon name="whatsapp" size={15} />
                WhatsApp
              </a>
              <a href={SITE.phoneHref} className="btn btn-outline btn-sm">
                <Icon name="phone" size={14} />
                {SITE.phone}
              </a>
            </div>

            <div className="mt-6 flex gap-3">
              <Social href={SITE.instagram} icon="instagram" label="Instagram" />
              <Social href={SITE.youtube} icon="youtube" label="YouTube" />
              <Social href={SITE.facebook} icon="facebook" label="Facebook" />
              <Social href={LOCATIONS[0].mapUrl} icon="map" label="Google Maps" />
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

        <div className="mt-12 border-t border-white/8 pt-8">
          <p className="mb-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-dim">
            Popular accessory pages
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LANDING_MODELS.map((m) => (
              <li key={m.slug}>
                <Link href={`/accessories/${m.slug}`} className="text-xs text-dim transition-colors hover:text-accent">
                  {m.name} accessories
                </Link>
              </li>
            ))}
            <li>
              <Link href="/used-cars" className="text-xs text-dim transition-colors hover:text-accent">
                Used cars
              </Link>
            </li>
            <li>
              <Link href="/car-modification" className="text-xs text-dim transition-colors hover:text-accent">
                Car modification near me
              </Link>
            </li>
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-dim md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Motorbotz Automotive Pvt. Ltd. All rights reserved.</p>
          <p>
            Modifications are carried out in line with the Central Motor Vehicles Rules. GSTIN
            29AAJCM4412Q1ZP.
          </p>
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
      className="grid h-10 w-10 place-items-center border border-white/12 text-ash transition-colors hover:border-accent hover:text-accent"
    >
      <Icon name={icon} size={18} />
    </a>
  );
}
