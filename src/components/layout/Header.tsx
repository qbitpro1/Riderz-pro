"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { SearchPanel } from "@/components/search/SearchPanel";
import { useCart } from "@/components/cart/CartContext";
import { PRIMARY_NAV, SECONDARY_NAV, SITE, whatsapp } from "@/lib/data/site";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen ? "glass" : "border-b border-transparent bg-gradient-to-b from-black/70 to-transparent"
        }`}
      >
        <div className="shell flex h-14 items-center justify-between gap-4 md:h-[68px]">
          <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="Motorbotz home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 xl:flex" aria-label="Primary">
            {PRIMARY_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative font-display text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                    active ? "text-accent" : "text-chalk/85 hover:text-chalk"
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute -bottom-2 left-0 h-px w-full bg-accent" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 md:gap-2">
            <IconButton label="Search" onClick={() => setSearchOpen(true)}>
              <Icon name="search" size={20} />
            </IconButton>

            <Link
              href="/cart"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              className="relative grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-accent"
            >
              <Icon name="bag" size={20} />
              {count > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#04161d] tnum">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>

            <a
              href={whatsapp("Hi Motorbotz, I have a question.")}
              target="_blank"
              rel="noreferrer noopener"
              className="hidden h-10 items-center gap-2 border border-white/15 px-3 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-chalk/85 transition-colors hover:border-[#1faa53] hover:text-[#3ddc7f] lg:inline-flex"
            >
              <Icon name="whatsapp" size={16} />
              WhatsApp
            </a>

            <IconButton
              label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
              className="xl:hidden"
            >
              <Icon name={menuOpen ? "close" : "menu"} size={22} />
            </IconButton>

            <IconButton label="Menu" onClick={() => setMenuOpen((v) => !v)} className="hidden xl:grid">
              <Icon name={menuOpen ? "close" : "menu"} size={22} />
            </IconButton>
          </div>
        </div>
      </header>

      {menuOpen && <MegaMenu onClose={() => setMenuOpen(false)} />}
      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
    </>
  );
}

function IconButton({
  children,
  label,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-accent ${className}`}
    >
      {children}
    </button>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-baseline font-display text-[19px] font-extrabold tracking-[-0.04em] md:text-[22px] ${className}`}>
      MOTOR
      <span className="text-accent">BOTZ</span>
    </span>
  );
}

function MegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 top-14 z-40 overflow-y-auto bg-void/97 backdrop-blur-xl md:top-[68px]">
      <div className="shell py-8">
        <p className="eyebrow mb-5">Everything Motorbotz</p>
        <ul className="grid gap-px overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href} className="bg-void">
              <Link
                href={item.href}
                onClick={onClose}
                className="group flex h-full flex-col justify-between gap-6 p-5 transition-colors hover:bg-white/4"
              >
                <span className="font-display text-xl font-extrabold uppercase tracking-[-0.02em] group-hover:text-accent">
                  {item.label}
                </span>
                <span className="flex items-end justify-between gap-3">
                  <span className="text-xs leading-snug text-ash">{item.blurb}</span>
                  <Icon name="arrow" size={16} className="shrink-0 text-dim group-hover:text-accent" />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <p className="eyebrow mb-4">More studios</p>
            <ul className="space-y-3">
              {SECONDARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="inline-flex items-center gap-2 text-sm text-ash transition-colors hover:text-chalk"
                  >
                    <Icon name="chevron" size={13} className="text-accent" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4">Talk to us</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsapp("Hi Motorbotz, I want to discuss a build.")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp btn-block sm:w-auto"
              >
                <Icon name="whatsapp" size={16} />
                WhatsApp us
              </a>
              <a href={SITE.phoneHref} className="btn btn-outline btn-block sm:w-auto">
                <Icon name="phone" size={15} />
                {SITE.phone}
              </a>
            </div>
            <p className="mt-4 text-xs text-dim">{SITE.hours}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
