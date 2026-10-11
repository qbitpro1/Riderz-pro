/**
 * NAVIGATION DATA
 *
 * Every menu on the site (desktop dropdowns, the "More" panel, the mobile
 * drawer, the bottom bar and the footer) reads from here. A menu change is a
 * data edit in this file; the components only render what they are given.
 *
 * Client-safe: imports no server-only modules.
 */

import { BRANDS } from "@/lib/catalog/brands";
import { DEPARTMENTS, departmentHref, groupHref, oeHref, type Department, type DepartmentSlug } from "@/lib/data/taxonomy";
import { LANDING_MODELS } from "@/lib/data/vehicles";
import type { IconName } from "@/components/ui/Icon";

export type NavLink = { label: string; href: string };

/** A titled list of links, with an optional "see all" footer link. */
export type NavSection = { id: string; title: string; links: NavLink[]; all?: NavLink };

export type DepartmentMenu = {
  slug: DepartmentSlug;
  label: string;
  href: string;
  groups: NavLink[];
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
      .map((g) => ({ label: g.name, href: groupHref(d.slug, g.slug) })),
    oe: { label: "OE — Original Equipment", href: oeHref(d.slug) },
    all: { label: `Shop all ${d.name}`, href: departmentHref(d.slug) },
  };
}

export const DEPARTMENT_MENUS: DepartmentMenu[] = DEPARTMENTS.map(toMenu);

export const SHOP_BY_CAR: NavSection = {
  id: "shop-by-car",
  title: "Shop by Car",
  links: LANDING_MODELS.slice(0, 10).map((m) => ({
    label: `${m.brand} ${m.name}`,
    href: `/accessories/${m.slug}`,
  })),
  all: { label: "All cars", href: "/shop" },
};

export const BRANDS_NAV: NavSection = {
  id: "brands",
  title: "Brands",
  links: BRANDS.map((b) => ({ label: b.name, href: `/brands/${b.slug}` })),
  all: { label: "All brands", href: "/brands" },
};

export const SERVICES_NAV: NavSection = {
  id: "services",
  title: "Services",
  links: [
    { label: "Installation & Garage", href: "/garage" },
    { label: "PPF & Detailing", href: "/ppf" },
    { label: "Audio Builds", href: "/audio" },
    { label: "Body Kits", href: "/body-kits" },
    { label: "Off-Road Builds", href: "/off-road" },
    { label: "Custom Interiors", href: "/interiors" },
    { label: "Performance", href: "/performance" },
    { label: "Build Your Car", href: "/build" },
  ],
};

export const CARS_NAV: NavSection = {
  id: "cars",
  title: "Cars",
  links: [
    { label: "Buy Cars", href: "/cars" },
    { label: "Sell Your Car", href: "/sell" },
    { label: "BE 6", href: "/be-6" },
    { label: "BE 6 Limited Edition", href: "/be-6/limited-edition" },
    { label: "List Your Cars", href: "/partners" },
  ],
};

/** Columns of the desktop "More" panel, and the drawer sections after the departments. */
export const MORE_SECTIONS: NavSection[] = [SHOP_BY_CAR, BRANDS_NAV, SERVICES_NAV, CARS_NAV];

/** Footer: "Shop by" column. */
export const SHOP_BY_LINKS: NavLink[] = [
  { label: "Car", href: "/shop" },
  { label: "Brand", href: "/brands" },
  { label: "OE", href: "/shop?oe=1" },
  { label: "Collections", href: "/collections" },
  { label: "Wishlist", href: "/wishlist" },
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
