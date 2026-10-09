"use client";

import { useLayoutEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { THEME_KEY, type Theme } from "./theme";

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
}

/**
 * Sun/moon switch. The inline script in the root layout has already set the
 * theme before paint; this keeps React in step with it, re-applies it after
 * the dev-mode Strict Mode remount (which clears <html> attributes), and
 * follows the device setting until the visitor makes a choice of their own.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useLayoutEffect(() => {
    const initial = storedTheme() ?? systemTheme();
    apply(initial);
    setTheme(initial);

    const media = matchMedia("(prefers-color-scheme: dark)");
    const follow = () => {
      if (storedTheme()) return;
      const next = systemTheme();
      apply(next);
      setTheme(next);
    };
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    apply(next);
    setTheme(next);
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
      {/* Both are rendered and CSS picks one from <html data-theme>, which the
          head script set before paint — so the icon is right before hydration. */}
      <Icon name="moon" size={19} className="when-light" />
      <Icon name="sun" size={19} className="when-dark" />
    </button>
  );
}
