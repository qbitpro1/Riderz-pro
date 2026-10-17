"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Routes that bring their own chrome.
 *   /vendor/dashboard  the seller dashboard has its own header, sidebar and bottom bar, so none of
 *                      the shopper chrome (menus, cart, footer, bottom bar, WhatsApp) shows there
 *   /store             a seller's offline store screen runs full screen in their shop: no site
 *                      header either, nothing that leads a customer away from it
 *   /rider             the rider app (a phone on the road) has its own small header
 */
const NO_FOOTER = ["/vendor/dashboard", "/store", "/rider"];
const NO_HEADER = ["/vendor/dashboard", "/store", "/rider"];

const under = (pathname: string, roots: string[]) => roots.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Renders a part of the site's shopper chrome except on routes that bring their own. */
export function SiteChrome({ part, children }: { part: "header" | "footer"; children: ReactNode }) {
  const pathname = usePathname();
  return under(pathname, part === "header" ? NO_HEADER : NO_FOOTER) ? null : <>{children}</>;
}
