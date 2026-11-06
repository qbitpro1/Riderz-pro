/**
 * SITE LANGUAGE
 *
 * The site is written in English. Other languages are machine-translated in the browser by Google's
 * website translator (SiteTranslate.tsx), which reads its choice from the `googtrans` cookie
 * ("/en/hi" = English → Hindi). That cookie is the only place the choice is stored, so it survives a
 * reload and applies to every page. English clears it, and then Google's script is never loaded.
 */

export const LANGUAGES = [
  { code: "en", label: "English", english: "English" },
  { code: "hi", label: "हिन्दी", english: "Hindi" },
  { code: "te", label: "తెలుగు", english: "Telugu" },
  { code: "ta", label: "தமிழ்", english: "Tamil" },
  { code: "kn", label: "ಕನ್ನಡ", english: "Kannada" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const CODES = LANGUAGES.map((l) => l.code) as readonly string[];
const COOKIE = "googtrans";

/** The language the page is shown in, from the cookie. English when unset or unreadable. */
export function readLanguage(): LanguageCode {
  if (typeof document === "undefined") return "en";
  try {
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
    const code = m ? decodeURIComponent(m[1]).split("/").pop() ?? "" : "";
    return (CODES.includes(code) ? code : "en") as LanguageCode;
  } catch {
    return "en";
  }
}

/**
 * Domains the cookie is written on. Google's script reads it both on the host and on the parent
 * domain (".riderzpro.com"), so it is set (and cleared) on both, or a stale copy would win.
 */
function cookieDomains(): (string | null)[] {
  const host = window.location.hostname;
  const isIp = /^[\d.]+$/.test(host) || host.includes(":");
  if (isIp || !host.includes(".")) return [null];
  const parts = host.split(".");
  const parent = parts.length > 2 ? `.${parts.slice(-2).join(".")}` : `.${host}`;
  return [null, parent, `.${host}`];
}

/** Saves the choice and reloads, so the whole page (and every later page) is shown in it. */
export function setLanguage(code: LanguageCode): void {
  try {
    const year = 60 * 60 * 24 * 365;
    for (const domain of cookieDomains()) {
      const d = domain ? `; domain=${domain}` : "";
      document.cookie =
        code === "en"
          ? `${COOKIE}=; path=/${d}; max-age=0; SameSite=Lax`
          : `${COOKIE}=/en/${code}; path=/${d}; max-age=${year}; SameSite=Lax`;
    }
  } catch {
    // Cookies blocked: the page simply stays in English.
  }
  window.location.reload();
}
