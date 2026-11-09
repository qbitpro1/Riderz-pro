/**
 * NAVIGATION DATA
 *
 * Every menu on the site (desktop dropdowns, the "More" panel, the mobile
 * drawer, the bottom bar and the footer) reads from here. A menu change is a
 * data edit in this file; the components only render what they are given.
 *
 * Client-safe: imports no server-only modules.
 */

import { DEPARTMENTS, departmentHref, groupHref, oeHref, type Department, type DepartmentSlug } from "@/lib/data/taxonomy";
import type { IconName } from "@/components/ui/Icon";

export type NavLink = { label: string; href: string };

/** A department's shelf groups that hold products, by department slug (see `LIVE_GROUPS`). */
export type LiveGroups = Record<string, string[]>;

/** A titled list of links, with an optional "see all" footer link. */
export type NavSection = { id: string; title: string; links: NavLink[]; all?: NavLink };

export type DepartmentMenu = {
  slug: DepartmentSlug;
  label: string;
  href: string;
  groups: (NavLink & { slug: string })[];
  oe: NavLink;
  all: NavLink;
};

/** The catch-all group is a safety net for unplaced labels, not a menu entry. */
const HIDDEN_GROUPS = new Set(["more"]);

function toMenu(d: Department): DepartmentMenu {
  return {
    slug: d.slug,
    label: d.short,
    href: departmentHref(d.slug),
    groups: d.groups
      .filter((g) => !HIDDEN_GROUPS.has(g.slug))
      .map((g) => ({ slug: g.slug, label: g.name, href: groupHref(d.slug, g.slug) })),
    oe: { label: "OE — Original Equipment", href: oeHref(d.slug) },
    all: { label: `Shop all ${d.name}`, href: departmentHref(d.slug) },
  };
}

/** A department's groups without the empty shelves; with no `live` data every group is kept. */
export function liveMenuGroups(d: DepartmentMenu, live?: LiveGroups) {
  const slugs = live?.[d.slug];
  return live ? d.groups.filter((g) => slugs?.includes(g.slug)) : d.groups;
}

export const DEPARTMENT_MENUS: DepartmentMenu[] = DEPARTMENTS.map(toMenu);

/** Shopping shortcuts: the "More" panel's first column. */
export const SHOP_MORE_NAV: NavSection = {
  id: "shop-more",
  title: "Shop",
  links: [
    { label: "All products", href: "/shop" },
    { label: "Offers", href: "/offers" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Track your order", href: "/track-order" },
    { label: "Ask AI", href: "/assistant" },
  ],
};

/** Partner programmes: sellers and delivery riders who work with Riderzpro. */
export const PARTNERS_NAV: NavSection = {
  id: "partners",
  title: "Partners",
  links: [
    { label: "Sell on Riderzpro", href: "/vendor" },
    { label: "Vendor Sign In", href: "/vendor/auth" },
    { label: "Ride with Riderzpro", href: "/rider" },
  ],
};

/** Columns of the desktop "More" panel, and the drawer sections after the departments. */
export const MORE_SECTIONS: NavSection[] = [SHOP_MORE_NAV, PARTNERS_NAV];

/** Footer: "Shop by" column. */
export const SHOP_BY_LINKS: NavLink[] = [
  { label: "All products", href: "/shop" },
  { label: "OE", href: "/shop?oe=1" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Offers", href: "/offers" },
  { label: "AI assistant", href: "/assistant" },
];

/** Mobile bottom bar. `kind` decides how the item behaves. */
export type BottomNavItem = {
  kind: "link" | "search" | "cart" | "menu";
  label: string;
  icon: IconName;
  href?: string;
};

export const BOTTOM_NAV: BottomNavItem[] = [
  { kind: "link", label: "Home", href: "/", icon: "home" },
  { kind: "link", label: "Shop", href: "/shop", icon: "wheel" },
  { kind: "search", label: "Search", icon: "search" },
  { kind: "cart", label: "Cart", href: "/cart", icon: "bag" },
  { kind: "menu", label: "Menu", icon: "menu" },
];
