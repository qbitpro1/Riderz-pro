"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { BOTTOM_NAV } from "@/lib/data/site";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-void/92 backdrop-blur-xl safe-b lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {BOTTOM_NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-accent" : "text-ash"
                }`}
              >
                <span className="relative">
                  <Icon name={item.icon as IconName} size={21} />
                  {active && (
                    <span className="absolute -top-3 left-1/2 h-0.5 w-6 -translate-x-1/2 bg-accent" />
                  )}
                </span>
                <span className="font-display text-[10px] font-bold uppercase tracking-[0.1em]">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
