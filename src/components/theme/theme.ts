export type Theme = "light" | "dark";

export const THEME_KEY = "riderzpro.theme";

/** Browser chrome colour per theme — the page background. */
export const THEME_COLOR: Record<Theme, string> = { light: "#ffffff", dark: "#050607" };

/**
 * Point every `<meta name="theme-color">` at the active theme's colour. The
 * server renders one per OS colour scheme (via `media`); those follow the
 * device, not the in-page toggle, so the media query is dropped and the colour
 * set directly. Creates the tag if the document has none yet.
 */
export function applyThemeColor(theme: Theme) {
  const color = THEME_COLOR[theme];
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  if (metas.length === 0) {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = color;
    document.head.appendChild(meta);
    return;
  }
  metas.forEach((meta) => {
    meta.removeAttribute("media");
    meta.content = color;
  });
}

/**
 * Runs in <head> before first paint: a saved choice wins, otherwise the
 * device's preference. The server always renders `data-theme="light"`.
 * Also sets the browser `theme-color` to match (see `applyThemeColor`).
 */
export const THEME_SCRIPT = `(function(){try{var C=${JSON.stringify(THEME_COLOR)};var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t);var m=document.querySelectorAll('meta[name="theme-color"]');if(!m.length){var e=document.createElement("meta");e.name="theme-color";document.head.appendChild(e);m=[e]}for(var i=0;i<m.length;i++){m[i].removeAttribute("media");m[i].setAttribute("content",C[t])}}catch(e){}})()`;
