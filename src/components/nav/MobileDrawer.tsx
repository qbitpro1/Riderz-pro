"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/brand/Logo";
import { DEPARTMENT_MENUS, MORE_SECTIONS, liveMenuGroups, type LiveGroups } from "@/lib/data/nav";
import { SITE, whatsapp } from "@/lib/data/site";
import { WishlistLink } from "@/components/wishlist/WishlistLink";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The menu drawer below xl. Accordions for the eight departments, then Shop by
 * Car, Brands, Services and Cars, then the contact buttons.
 * Escape closes, body scroll is locked while open, focus moves in on open and
 * returns to whatever opened it on close.
 */
export function MobileDrawer({ onClose, liveGroups }: { onClose: () => void; liveGroups?: LiveGroups }) {
  const [shown, setShown] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => {
      setShown(true);
      closeBtn.current?.focus();
    });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const els = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.closest("[inert]"),
      );
      if (els.length === 0) return;
      const first = els[0];
      const last = els[els.length - 1];
      const cur = document.activeElement;
      if (!panel.current.contains(cur)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && cur === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && cur === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // The drawer is `xl:hidden`; if the viewport crosses that breakpoint while it is
    // open (rotation, window resize) close it so the scroll lock and trap don't linger.
    const mq = window.matchMedia("(min-width: 80rem)");
    const onBreakpoint = (e: MediaQueryListEvent) => e.matches && onClose();
    mq.addEventListener("change", onBreakpoint);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onBreakpoint);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className="fixed inset-0 z-[60] xl:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-void/70 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
      />
      <div
        ref={panel}
        className={`absolute inset-y-0 right-0 flex w-[min(24rem,100%)] flex-col border-l border-tint/10 bg-void shadow-2xl shadow-tint/10 transition-[transform,opacity] duration-200 ${
          shown ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-tint/10 px-4 md:h-[68px]">
          <Link href="/" onClick={onClose} aria-label="Riderzpro home">
            <Logo />
          </Link>
          <button
            ref={closeBtn}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-accent"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-4">
          <p className="eyebrow mb-2">Shop</p>
          <ul className="border-t border-tint/10">
            {DEPARTMENT_MENUS.map((d) => (
              <li key={d.slug} className="border-b border-tint/10">
                <Accordion id={`dept-${d.slug}`} title={d.label} open={openId === d.slug} onToggle={() => toggle(d.slug)}>
                  <ul>
                    {liveMenuGroups(d, liveGroups).map((g) => (
                      <DrawerLink key={g.href} href={g.href} onClose={onClose}>
                        {g.label}
                      </DrawerLink>
                    ))}
                  </ul>
                  <Link
                    href={d.oe.href}
                    onClick={onClose}
                    className="my-1 flex items-center justify-between bg-accent/10 px-3 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-accent"
                  >
                    {d.oe.label}
                    <Icon name="chevron" size={12} />
                  </Link>
                  <Link
                    href={d.all.href}
                    onClick={onClose}
                    className="block px-3 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-chalk"
                  >
                    {d.all.label}
                  </Link>
                </Accordion>
              </li>
            ))}
          </ul>

          <p className="eyebrow mb-2 mt-8">Explore</p>
          <ul className="border-t border-tint/10">
            {MORE_SECTIONS.map((s) => (
              <li key={s.id} className="border-b border-tint/10">
                <Accordion id={`sec-${s.id}`} title={s.title} open={openId === s.id} onToggle={() => toggle(s.id)}>
                  <ul>
                    {s.links.map((l) => (
                      <DrawerLink key={l.href} href={l.href} onClose={onClose}>
                        {l.label}
                      </DrawerLink>
                    ))}
                  </ul>
                  {s.all && (
                    <Link
                      href={s.all.href}
                      onClick={onClose}
                      className="block px-3 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-accent"
                    >
                      {s.all.label}
                    </Link>
                  )}
                </Accordion>
              </li>
            ))}
          </ul>

          <ul className="mt-6 border-t border-tint/10 pt-4">
            <li>
              <WishlistLink variant="text" className="flex min-h-11 items-center" />
            </li>
            {[
              { label: "Collections", href: "/collections" },
              { label: "Track Order", href: "/track-order" },
              { label: "FAQ", href: "/faq" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex min-h-11 items-center font-display text-[13px] font-bold uppercase tracking-[0.12em] text-chalk hover:text-accent"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="eyebrow mb-3">Talk to us</p>
            <div className="flex flex-col gap-3">
              <a
                href={whatsapp("Hi Riderzpro, I have a question.")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp btn-block"
              >
                <Icon name="whatsapp" size={16} />
                WhatsApp us
              </a>
              <a href={SITE.phoneHref} className="btn btn-outline btn-block">
                <Icon name="phone" size={15} />
                {SITE.phone}
              </a>
            </div>
            <p className="mt-3 text-xs text-dim">{SITE.hours}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DrawerLink({ href, onClose, children }: { href: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        onClick={onClose}
        className="block px-3 py-2.5 text-sm text-ash transition-colors hover:text-chalk"
      >
        {children}
      </Link>
    </li>
  );
}

function Accordion({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3.5 text-left font-display text-sm font-bold uppercase tracking-[0.1em] text-chalk transition-colors hover:text-accent"
      >
        {title}
        <Icon
          name="chevron"
          size={14}
          className={`text-dim transition-transform duration-150 ${open ? "rotate-90" : ""}`}
        />
      </button>
      <div
        id={id}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="pb-3">{children}</div>
        </div>
      </div>
    </>
  );
}
