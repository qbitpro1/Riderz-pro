"use client";

import { useEffect } from "react";
import { LANGUAGES, readLanguage } from "./languages";
import { BRANDS } from "@/lib/catalog/brands";

declare global {
  interface Window {
    __rzpTranslateInit?: () => void;
    google?: { translate?: { TranslateElement: new (opts: Record<string, unknown>, id: string) => unknown } };
  }
}

const SCRIPT_ID = "rzp-google-translate";
const ELEMENT_ID = "google_translate_element";

/**
 * Machine translation of the whole page into the shopper's chosen language (see languages.ts).
 *
 * Nothing loads for English. For another language, Google's website translator is loaded once and
 * translates the page in place, following the `googtrans` cookie. Its own toolbar and tooltips are
 * hidden: the language is changed from the profile menu.
 *
 * The translator replaces text nodes behind React's back, which makes React throw ("removeChild …
 * not a child of this node") when it later updates that text. While a translation is active,
 * removeChild / insertBefore tolerate a node that has moved, the standard workaround.
 */
export function SiteTranslate() {
  useEffect(() => {
    // Staff screens stay in English: translated admin data would be misleading.
    if (readLanguage() === "en" || window.location.pathname.startsWith("/admin")) return;
    tolerateTranslatedDom();
    const stopProtecting = protectNames();
    if (document.getElementById(SCRIPT_ID)) return stopProtecting;

    window.__rzpTranslateInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement) return;
      new TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: LANGUAGES.filter((l) => l.code !== "en").map((l) => l.code).join(","),
          autoDisplay: false,
        },
        ELEMENT_ID,
      );
    };
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = "https://translate.google.com/translate_a/element.js?cb=__rzpTranslateInit";
    s.async = true;
    document.body.appendChild(s);
    return stopProtecting;
  }, []);

  return (
    <>
      <div id={ELEMENT_ID} hidden />
      <style>{HIDE_GOOGLE_UI}</style>
    </>
  );
}

/** Google's banner pushes the page down and its hover tooltips cover content: both stay hidden. */
const HIDE_GOOGLE_UI = `
.goog-te-banner-frame, iframe.skiptranslate, .goog-te-balloon-frame, #goog-gt-tt, .goog-te-spinner-pos,
.VIpgJd-ZVi9od-ORHb-OEVmcd, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .VIpgJd-yAWNEb-L7lbkb { display: none !important; }
body { top: 0 !important; position: static !important; }
.goog-text-highlight, font[style*="background-color"] { background: none !important; box-shadow: none !important; }
`;

/**
 * Brand names are words too: machine translation turned "RECOIL" into the Hindi for "pull back".
 * Any element whose own text names a brand (a brand link, a product title such as "RECOIL Echo
 * Series…") is marked translate="no" and stays in English, now and as new content appears.
 */
// Car-audio words too: "Speakers" came back as the Hindi for people giving speeches. Shoppers use
// these English words anyway. All plain words and spaces, so they go into the pattern as they are;
// the surrounding classes stand in for word boundaries ("recoiling" is not a brand).
const TERMS = ["Speakers?", "Tweeters?", "Subwoofers?", "Woofers?", "Amplifiers?", "Midrange", "Coaxial", "Component", "Soundbars?"];
const NAMES = [...BRANDS.map((b) => b.name), "Qubo", "GFX Pro"].filter((n) => /^[A-Za-z0-9 ]+$/.test(n)).concat(TERMS);
const KEEP = new RegExp(`(^|[^A-Za-z0-9])(${NAMES.join("|")})($|[^A-Za-z0-9])`, "i");

function protectNames(): () => void {
  const mark = (root: Node) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (el && !el.closest("[translate=no], .notranslate") && KEEP.test(n.nodeValue ?? "")) el.setAttribute("translate", "no");
    }
  };
  mark(document.body);
  const observer = new MutationObserver((records) => {
    for (const r of records) r.addedNodes.forEach((n) => (n.nodeType === Node.TEXT_NODE ? n.parentNode && mark(n.parentNode) : mark(n)));
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

let patched = false;
function tolerateTranslatedDom() {
  if (patched || typeof Node === "undefined") return;
  patched = true;
  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };
  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return node;
    return insertBefore.call(this, node, ref) as T;
  };
}
