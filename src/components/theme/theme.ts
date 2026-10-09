export type Theme = "light" | "dark";

export const THEME_KEY = "riderzpro.theme";

/**
 * Runs in <head> before first paint: a saved choice wins, otherwise the
 * device's preference. The server always renders `data-theme="light"`.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

/** Browser chrome colour per theme — the page background. */
export const THEME_COLOR: Record<Theme, string> = { light: "#ffffff", dark: "#050607" };
