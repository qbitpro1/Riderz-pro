"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { Icon } from "@/components/ui/Icon";
import { THEME_KEY, applyThemeColor, type Theme } from "./theme";

function storedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  applyThemeColor(theme);
}

/** The theme on <html data-theme>, watched so every toggle and the device setting show at once. */
function subscribeTheme(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}
const currentTheme = (): Theme | null => {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : null;
};

/**
 * Sun/moon switch. The inline script in the root layout has already set the theme before paint;
 * this re-applies it after the dev-mode Strict Mode remount (which clears <html> attributes) and
 * follows the device setting until the visitor makes a choice of their own. The icon is chosen by
 * CSS from <html data-theme>, so it is right before hydration.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => null);

  useLayoutEffect(() => {
    apply(storedTheme() ?? systemTheme());
    const media = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      if (!storedTheme()) apply(systemTheme());
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    apply(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage blocked — the switch still works for this visit */
    }
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center text-chalk/85 transition-colors hover:text-accent ${className}`}
    >
      <Icon name="moon" size={19} className="when-light" />
      <Icon name="sun" size={19} className="when-dark" />
    </button>
  );
}
