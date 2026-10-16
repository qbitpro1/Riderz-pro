"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Routes that bring their own chrome.
 *   /vendor/dashboard  the seller dashboard has its own sidebar and bottom bar, so the site's
 *                      footer, bottom bar and WhatsApp button stay off it (they overlapped on phones)
 *   /store             a seller's offline store screen runs full screen in their shop: no site
 *                      header either, nothing that leads a customer away from it
 */
const NO_FOOTER = ["/vendor/dashboard", "/store"];
const NO_HEADER = ["/store"];

const under = (pathname: string, roots: string[]) => roots.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Renders a part of the site's shopper chrome except on routes that bring their own. */
export function SiteChrome({ part, children }: { part: "header" | "footer"; children: ReactNode }) {
  const pathname = usePathname();
  return under(pathname, part === "header" ? NO_HEADER : NO_FOOTER) ? null : <>{children}</>;
}
