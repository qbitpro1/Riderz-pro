"use client";

import { Icon } from "@/components/ui/Icon";
import { useWishlist, type WishlistInput } from "./wishlistStore";

/**
 * Heart toggle. `overlay` sits over a card photo (own solid surface so it reads
 * on any image); `inline` is text + icon for the buy box.
 */
export function WishlistButton({
  item,
  variant,
  className = "",
}: {
  item: WishlistInput;
  variant: "overlay" | "inline";
  className?: string;
}) {
  const { has, toggle, ready } = useWishlist();
  const saved = ready && has(item.slug);
  const label = saved ? "Remove from wishlist" : "Save to wishlist";
  const heart = <Icon name="heart" size={18} filled={saved} className={saved ? "text-accent" : ""} />;
  const focus =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  if (variant === "overlay") {
    return (
      <button
        type="button"
        aria-pressed={saved}
        aria-label={label}
        title={label}
        onClick={() => toggle(item)}
        className={`z-10 grid h-10 w-10 place-items-center rounded-full border border-tint/10 bg-void/85 text-chalk transition-colors duration-150 hover:text-accent ${focus} ${className}`}
      >
        {heart}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggle(item)}
      className={`inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ash transition-colors duration-150 hover:text-accent ${focus} ${className}`}
    >
      {heart}
      {label}
    </button>
  );
}
