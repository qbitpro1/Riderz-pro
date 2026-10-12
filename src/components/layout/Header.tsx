"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/brand/Logo";
import { SearchPanel } from "@/components/search/SearchPanel";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useCart } from "@/components/cart/CartContext";
import { DesktopNav } from "@/components/nav/DesktopNav";
import { MobileDrawer } from "@/components/nav/MobileDrawer";
import { navActions, useNavState } from "@/components/nav/navStore";
import type { LiveGroups } from "@/lib/data/nav";
import { whatsapp } from "@/lib/data/site";

export function Header({ liveGroups }: { liveGroups?: LiveGroups }) {
  const [scrolled, setScrolled] = useState(false);
  const { drawer, search } = useNavState();
  const pathname = usePathname();
  const { count, openCart } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    navActions.closeAll();
  }, [pathname]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "glass" : "header-top"}`}
      >
        <div className="shell flex h-14 items-center justify-between gap-3 md:h-[68px]">
          <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="Riderzpro home">
            <Logo />
          </Link>

          <DesktopNav liveGroups={liveGroups} />

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <IconButton label="Search" onClick={navActions.openSearch}>
              <Icon name="search" size={20} />
            </IconButton>

            <button
              type="button"
              onClick={openCart}
              aria-haspopup="dialog"
              aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
              className="relative grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-accent"
            >
              <Icon name="bag" size={20} />
              {count > 0 && (
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent tnum">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>

            {/* Icon-only at xl so the department row fits at 1280px; labelled again from 2xl. */}
            <a
              href={whatsapp("Hi Riderzpro, I have a question.")}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="WhatsApp"
              className="hidden h-10 items-center gap-2 border border-tint/15 px-3 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-chalk/85 transition-colors hover:border-accent hover:text-accent lg:inline-flex xl:w-10 xl:justify-center xl:px-0 2xl:w-auto 2xl:px-3"
            >
              <Icon name="whatsapp" size={16} />
              <span className="xl:sr-only 2xl:not-sr-only">WhatsApp</span>
            </a>

            <IconButton label="Open menu" onClick={navActions.openDrawer} className="xl:hidden">
              <Icon name="menu" size={22} />
            </IconButton>
          </div>
        </div>
      </header>

      {drawer && <MobileDrawer liveGroups={liveGroups} onClose={navActions.closeDrawer} />}
      {search && <SearchPanel onClose={navActions.closeSearch} />}
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
