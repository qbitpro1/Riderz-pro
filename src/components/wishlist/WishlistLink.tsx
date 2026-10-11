"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useWishlist } from "./wishlistStore";

/**
 * Entry point to /wishlist. `icon` matches the header's cart control (40px,
 * count badge); `text` is a labelled row for menus and drawers.
 */
export function WishlistLink({ variant = "icon", className = "" }: { variant?: "icon" | "text"; className?: string }) {
  const { count, ready } = useWishlist();
  const n = ready ? count : 0;
  const label = `Wishlist, ${n} item${n === 1 ? "" : "s"}`;

  if (variant === "text") {
    return (
      <Link
        href="/wishlist"
        aria-label={label}
        className={`inline-flex min-h-10 items-center gap-2 text-sm font-semibold transition-colors hover:text-accent ${className}`}
      >
        <Icon name="heart" size={18} />
        Wishlist
        {n > 0 && <span className="text-dim tnum">({n})</span>}
      </Link>
    );
  }

  return (
    <Link
      href="/wishlist"
      aria-label={label}
      className={`relative grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-accent ${className}`}
    >
      <Icon name="heart" size={20} />
      {n > 0 && (
        <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent tnum">
          {n > 9 ? "9+" : n}
        </span>
      )}
    </Link>
  );
}
