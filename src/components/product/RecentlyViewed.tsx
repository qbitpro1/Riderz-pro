"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/client/hooks";
import { rupees } from "@/lib/format";
import { productHref, type ProductImage } from "@/lib/store/types";
import { imageBackdrop, ProductImageView } from "./ProductImageView";

const KEY = "riderzpro.recent.v1";
const MAX = 8;

export type SeenProduct = { slug: string; title: string; price: number | null; image: ProductImage | null };

function load(): SeenProduct[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? (parsed as SeenProduct[]).filter((s) => s && typeof s.slug === "string" && typeof s.title === "string")
      : [];
  } catch {
    return [];
  }
}

/** Records this product as viewed and shows the others the shopper looked at before. */
export function RecentlyViewed({ current }: { current: SeenProduct }) {
  // The history is in this browser's storage: shown once hydrated, afresh for each product.
  const hydrated = useHydrated();
  return hydrated ? <Recent key={current.slug} current={current} /> : null;
}

function Recent({ current }: { current: SeenProduct }) {
  // What was seen before this product (read once, before this visit is recorded below).
  const [others] = useState(() => load().filter((s) => s.slug !== current.slug));
  const { slug, title, price, image } = current;

  useEffect(() => {
    const prev = load();
    try {
      const next = [{ slug, title, price, image }, ...prev.filter((s) => s.slug !== slug)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked — nothing to remember */
    }
  }, [slug, title, price, image]);

  if (others.length === 0) return null;

  return (
    <section className="section border-t border-tint/8">
      <div className="shell">
        <p className="eyebrow">Recently viewed</p>
        <ul className="rail mt-4 gap-3">
          {others.map((s) => (
            <li key={s.slug} className="w-36 sm:w-40">
              <Link href={productHref(s.slug)} className="block">
                <div className={`relative aspect-square overflow-hidden border border-tint/8 ${imageBackdrop(s.image)}`}>
                  {s.image && <ProductImageView image={s.image} sizes="160px" />}
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-snug">{s.title}</p>
                <p className="mt-1 text-xs text-ash tnum">{s.price === null ? "Price on request" : rupees(s.price)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
