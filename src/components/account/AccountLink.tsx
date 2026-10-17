"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useAccount } from "./AccountContext";

/**
 * Entry point to the customer account: "/account" when signed in, sign-in otherwise. `icon` matches
 * the header's other 40px controls (a dot shows when signed in); `text` is a labelled row for menus.
 */
export function AccountLink({ variant = "icon", className = "" }: { variant?: "icon" | "text"; className?: string }) {
  const { customer, ready } = useAccount();
  const signedIn = ready && customer !== null;
  const href = signedIn ? "/account" : "/account/sign-in";
  const first = customer?.name?.trim().split(/\s+/)[0];
  const label = signedIn ? `Your account${first ? `, ${first}` : ""}` : "Sign in";

  if (variant === "text") {
    return (
      <Link href={href} className={`inline-flex min-h-10 items-center gap-2 text-sm font-semibold transition-colors hover:text-accent ${className}`}>
        <Icon name="user" size={18} />
        {signedIn ? `My account${first ? ` (${first})` : ""}` : "Sign in / My orders"}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`relative grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-accent ${className}`}
    >
      <Icon name="user" size={20} />
      {signedIn && <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-void" />}
    </Link>
  );
}
