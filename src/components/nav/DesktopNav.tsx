"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { DEPARTMENT_MENUS, MORE_SECTIONS, type NavLink, type NavSection } from "@/lib/data/nav";

const OPEN_DELAY = 80;
const CLOSE_DELAY = 160;

const triggerCls =
  "relative inline-flex h-full items-center gap-1 whitespace-nowrap px-1.5 font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-colors 2xl:px-3";

const itemCls =
  "block px-3 py-2 text-[13px] text-ash transition-colors hover:bg-tint/5 hover:text-chalk focus-visible:bg-tint/5 focus-visible:text-chalk";

/**
 * The desktop (xl and up) navigation row: eight department dropdowns and a
 * "More" mega panel. Only one panel is ever open. Hover opens with a short
 * delay, focus opens immediately, Escape closes and returns focus to the
 * trigger, and a click outside or a route change closes.
 */
export function DesktopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const show = useCallback(
    (id: string, immediate = false) => {
      clear();
      if (immediate || open !== null) setOpen(id);
      else timer.current = setTimeout(() => setOpen(id), OPEN_DELAY);
    },
    [clear, open],
  );

  const hide = useCallback(
    (id: string, immediate = false) => {
      clear();
      if (immediate) setOpen((cur) => (cur === id ? null : cur));
      else timer.current = setTimeout(() => setOpen((cur) => (cur === id ? null : cur)), CLOSE_DELAY);
    },
    [clear],
  );

  useEffect(() => {
    clear();
    setOpen(null);
  }, [pathname, clear]);

  useEffect(() => clear, [clear]);

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(null);
    };
    // A menu opened by hover has no focus inside it, so Escape has to be heard at the document.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      clear();
      setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, clear]);

  return (
    <nav ref={root} className="hidden h-full items-center xl:flex" aria-label="Primary">
      <ul className="flex h-full items-center">
        {DEPARTMENT_MENUS.map((d) => {
          const active = pathname === d.href || pathname.startsWith(`${d.href}/`);
          return (
            <Dropdown
              key={d.slug}
              id={d.slug}
              label={d.label}
              href={d.href}
              active={active}
              open={open === d.slug}
              show={show}
              hide={hide}
              panelClassName="left-0 w-72"
              relative
            >
              <ul className="py-1">
                {d.groups.map((g) => (
                  <li key={g.href}>
                    <Link href={g.href} className={itemCls}>
                      {g.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-1 border-t border-tint/10 pt-2">
                <Link
                  href={d.oe.href}
                  className="flex items-center justify-between gap-2 bg-accent/10 px-3 py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-accent transition-colors hover:bg-accent/20 focus-visible:bg-accent/20"
                >
                  {d.oe.label}
                  <Icon name="chevron" size={12} />
                </Link>
                <Link
                  href={d.all.href}
                  className="mt-1 block px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-chalk transition-colors hover:text-accent focus-visible:text-accent"
                >
                  {d.all.label}
                </Link>
              </div>
            </Dropdown>
          );
        })}

        <Dropdown
          id="more"
          label="More"
          active={false}
          open={open === "more"}
          show={show}
          hide={hide}
          panelClassName="left-1/2 w-[min(960px,calc(100vw-4rem))] -translate-x-1/2"
        >
          <div className="grid grid-cols-4 gap-6 p-2">
            {MORE_SECTIONS.map((s) => (
              <MoreColumn key={s.id} section={s} />
            ))}
          </div>
        </Dropdown>
      </ul>
    </nav>
  );
}

function MoreColumn({ section }: { section: NavSection }) {
  return (
    <div>
      <p className="eyebrow mb-2 px-3">{section.title}</p>
      <ul>
        {section.links.map((l: NavLink) => (
          <li key={l.href}>
            <Link href={l.href} className={itemCls}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      {section.all && (
        <Link
          href={section.all.href}
          className="mt-1 flex items-center gap-1.5 px-3 py-2 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-accent"
        >
          {section.all.label}
          <Icon name="arrow" size={12} />
        </Link>
      )}
    </div>
  );
}

type DropdownProps = {
  id: string;
  label: string;
  /** When set the label is a link to this URL as well as the trigger. */
  href?: string;
  active: boolean;
  open: boolean;
  show: (id: string, immediate?: boolean) => void;
  hide: (id: string, immediate?: boolean) => void;
  panelClassName: string;
  /** Anchor the panel to this item (department) rather than to the header (More). */
  relative?: boolean;
  children: React.ReactNode;
};

function Dropdown({ id, label, href, active, open, show, hide, panelClassName, relative, children }: DropdownProps) {
  const uid = useId();
  const panelId = `${uid}-panel`;
  const trigger = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const items = () => Array.from(panel.current?.querySelectorAll<HTMLElement>("a[href]") ?? []);

  const focusFirst = () => {
    requestAnimationFrame(() => items()[0]?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      hide(id, true);
      trigger.current?.focus();
      return;
    }
    const inPanel = panel.current?.contains(e.target as Node);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!inPanel) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          show(id, true);
          focusFirst();
        }
        return;
      }
      e.preventDefault();
      const list = items();
      const i = list.indexOf(e.target as HTMLElement);
      if (e.key === "ArrowDown") list[Math.min(i + 1, list.length - 1)]?.focus();
      else if (i <= 0) trigger.current?.focus();
      else list[i - 1]?.focus();
    }
  };

  const active_ = active ? "text-accent" : open ? "text-chalk" : "text-chalk/85 hover:text-chalk";
  const inner = (
    <>
      {label}
      <Icon
        name="chevron"
        size={10}
        className={`text-dim transition-transform duration-150 ${open ? "-rotate-90" : "rotate-90"}`}
      />
      {(active || open) && <span className="absolute inset-x-2.5 bottom-3 h-px bg-accent 2xl:inset-x-3" />}
    </>
  );

  return (
    <li
      className={`flex h-full items-center ${relative ? "relative" : ""}`}
      onMouseEnter={() => show(id)}
      onMouseLeave={() => hide(id)}
      onFocus={() => show(id, true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide(id, true);
      }}
      onKeyDown={onKeyDown}
    >
      {href ? (
        <Link
          ref={trigger}
          href={href}
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={panelId}
          className={`${triggerCls} ${active_}`}
        >
          {inner}
        </Link>
      ) : (
        <button
          ref={trigger}
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (open ? hide(id, true) : show(id, true))}
          className={`${triggerCls} ${active_}`}
        >
          {inner}
        </button>
      )}

      <div
        ref={panel}
        id={panelId}
        className={`absolute top-full z-50 border border-tint/10 bg-void p-2 shadow-2xl shadow-tint/10 transition-[opacity,transform,visibility] duration-150 ${panelClassName} ${
          open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0"
        }`}
      >
        {children}
      </div>
    </li>
  );
}
