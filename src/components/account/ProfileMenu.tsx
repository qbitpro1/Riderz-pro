"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useBrowserValue } from "@/lib/client/hooks";
import { Icon } from "@/components/ui/Icon";
import { useAccount } from "./AccountContext";
import { LANGUAGES, readLanguage, setLanguage, type LanguageCode } from "@/components/i18n/languages";

/**
 * The profile button at the top right of the header. It opens a small menu with the account links,
 * the site language and, when signed in, Log out. Escape, a click outside and moving to another page
 * close it; focus returns to the button.
 */
export function ProfileMenu() {
  const { customer, ready, signOut } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lang = useBrowserValue(readLanguage, "en");
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const signedIn = ready && customer !== null;
  const first = customer?.name?.trim().split(/\s+/)[0];
  const label = signedIn ? `Your account${first ? `, ${first}` : ""}` : "Account and language";

  // A new page closes the menu (adjusting state while rendering, not in an effect).
  const [shownFor, setShownFor] = useState(pathname);
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut(false);
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      setError("Couldn't log you out just now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const item =
    "flex min-h-11 w-full items-center gap-3 px-4 text-sm text-chalk transition-colors hover:bg-tint/5 hover:text-accent focus-visible:bg-tint/5";

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={`${uid}-menu`}
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-accent"
      >
        <Icon name="user" size={20} />
        {signedIn && <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-void" />}
      </button>

      {open && (
        <div
          id={`${uid}-menu`}
          className="nav-glass-panel absolute right-0 top-full z-[70] mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden"
        >
          <div className="border-b border-tint/10 px-4 py-3">
            {signedIn ? (
              <>
                <p className="truncate text-sm font-semibold text-chalk">{customer?.name || "Your account"}</p>
                <p className="truncate text-xs text-dim">{customer?.email || customer?.mobile || "Signed in"}</p>
              </>
            ) : (
              <p className="text-sm text-ash">You&apos;re not signed in.</p>
            )}
          </div>

          <nav aria-label="Account" className="py-1">
            {signedIn ? (
              <>
                <Link href="/account" className={item}>
                  <Icon name="user" size={16} />
                  My account
                </Link>
                <Link href="/account/orders" className={item}>
                  <Icon name="bag" size={16} />
                  My orders
                </Link>
                <Link href="/wishlist" className={item}>
                  <Icon name="heart" size={16} />
                  Wishlist
                </Link>
              </>
            ) : (
              <Link href={`/account/sign-in?next=${encodeURIComponent(pathname || "/")}`} className={item}>
                <Icon name="user" size={16} />
                Sign in / My orders
              </Link>
            )}
          </nav>

          <div className="border-t border-tint/10 px-4 py-3">
            <label htmlFor={`${uid}-lang`} className="label">
              Language
            </label>
            {/* Native names must not be machine-translated themselves. */}
            <select
              id={`${uid}-lang`}
              translate="no"
              className="field notranslate mt-1 h-11"
              value={lang}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code === "en" ? l.label : `${l.label} (${l.english})`}
                </option>
              ))}
            </select>
            {lang !== "en" && (
              <p className="mt-1.5 text-[11px] leading-snug text-dim">
                Translated automatically by Google. Prices and part numbers are as in English.
              </p>
            )}
          </div>

          {signedIn && (
            <div className="border-t border-tint/10 py-1">
              <button type="button" onClick={logOut} disabled={busy} aria-busy={busy} className={`${item} disabled:opacity-60`}>
                <Icon name="arrow" size={16} className="rotate-180" />
                {busy ? "Logging out…" : "Log out"}
              </button>
              {error && (
                <p role="alert" className="px-4 pb-2 text-xs text-danger">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
