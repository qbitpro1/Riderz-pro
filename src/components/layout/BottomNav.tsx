"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useCart } from "@/components/cart/CartContext";
import { navActions, useNavState } from "@/components/nav/navStore";
import { BOTTOM_NAV } from "@/lib/data/nav";

const cell = "flex h-16 w-full flex-col items-center justify-center gap-1 transition-colors";
const labelCls = "font-display text-[10px] font-bold uppercase tracking-[0.1em]";

export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();
  const { drawer, search } = useNavState();

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-tint/10 bg-void/92 backdrop-blur-xl safe-b lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {BOTTOM_NAV.map((item) => {
          const icon = <Icon name={item.icon} size={21} />;

          if (item.kind === "search" || item.kind === "menu") {
            const on = item.kind === "search" ? search : drawer;
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={item.kind === "search" ? navActions.openSearch : navActions.openDrawer}
                  aria-haspopup="dialog"
                  aria-expanded={on}
                  className={`${cell} ${on ? "text-accent" : "text-ash"}`}
                >
                  {icon}
                  <span className={labelCls}>{item.label}</span>
                </button>
              </li>
            );
          }

          const href = item.href ?? "/";
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={item.label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={item.kind === "cart" ? `Cart, ${count} item${count === 1 ? "" : "s"}` : undefined}
                className={`${cell} ${active ? "text-accent" : "text-ash"}`}
              >
                <span className="relative">
                  {icon}
                  {active && <span className="absolute -top-3 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-accent" />}
                  {item.kind === "cart" && count > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent tnum">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </span>
                <span className={labelCls}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
