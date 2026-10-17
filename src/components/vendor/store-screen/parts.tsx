"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  CarFront,
  CheckCircle2,
  Droplets,
  Minus,
  Plus,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wind,
  Wrench,
  ImageOff,
  type LucideIcon,
} from "lucide-react";
import { rupees } from "@/lib/format";
import { fileHref } from "@/lib/vendor/types";
import { offPct } from "./lib";
import type { ScreenStore } from "./types";

/** A product photo that fills its (relative, sized) parent on the light showroom backdrop. */
export function Photo({
  id,
  alt,
  sizes,
  className = "",
  priority = false,
  pad = "p-3",
}: {
  id: string | undefined;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  pad?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-[#f3f4f5] ${className}`}>
      {id ? (
        <Image src={fileHref(id)} alt={alt} fill sizes={sizes} priority={priority} className={`object-contain mix-blend-multiply ${pad}`} />
      ) : (
        <div className="grid h-full w-full place-items-center text-dim">
          <ImageOff size={28} aria-hidden />
          <span className="sr-only">No photo</span>
        </div>
      )}
    </div>
  );
}

/** Store mark: the seller's logo, or a monogram when there is none. */
export function StoreMark({ store, className = "h-14 w-14", text = "text-2xl" }: { store: ScreenStore; className?: string; text?: string }) {
  return (
    <div className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-tint/10 bg-void ${className}`}>
      {store.logo ? (
        <Image src={fileHref(store.logo)} alt="" fill sizes="160px" className="object-contain p-1.5" />
      ) : (
        <span className={`font-display font-extrabold text-accent ${text}`} aria-hidden>
          {store.name.trim().slice(0, 1).toUpperCase() || "S"}
        </span>
      )}
    </div>
  );
}

export function Price({
  p,
  size = "md",
  className = "",
}: {
  p: { mrp: number; price: number };
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const off = offPct(p);
  const main = { sm: "text-lg", md: "text-xl md:text-2xl", lg: "text-4xl md:text-5xl" }[size];
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2.5 gap-y-1 ${className}`}>
      <span className={`tnum font-display font-extrabold tracking-tight text-chalk ${main}`}>{rupees(p.price)}</span>
      {off > 0 && (
        <>
          <span className={`tnum text-dim line-through ${size === "lg" ? "text-lg" : "text-sm"}`}>
            <span className="sr-only">MRP </span>
            {rupees(p.mrp)}
          </span>
          <span className={`rounded-md bg-accent/10 px-1.5 py-0.5 font-bold text-accent ${size === "lg" ? "text-base" : "text-xs"}`}>{off}% off</span>
        </>
      )}
    </div>
  );
}

export function Stepper({
  value,
  min = 0,
  max,
  onChange,
  label,
  compact = false,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
  compact?: boolean;
}) {
  const size = compact ? "h-12 w-12" : "h-14 w-14";
  return (
    <div className="inline-flex items-center rounded-xl border border-tint/20 bg-void" role="group" aria-label={`Quantity, ${label}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className={`grid ${size} place-items-center rounded-l-xl text-chalk transition-colors active:bg-steel disabled:opacity-35`}
        aria-label={`One less ${label}`}
      >
        <Minus size={18} aria-hidden />
      </button>
      <span className="min-w-9 text-center text-lg font-bold tnum text-chalk" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className={`grid ${size} place-items-center rounded-r-xl text-chalk transition-colors active:bg-steel disabled:opacity-35`}
        aria-label={`One more ${label}`}
      >
        <Plus size={18} aria-hidden />
      </button>
    </div>
  );
}

/** Picks a lucide icon that suits a highlight line. */
export function highlightIcon(text: string): LucideIcon {
  const t = text.toLowerCase();
  if (/warrant|guarantee|certif|genuine|original/.test(t)) return ShieldCheck;
  if (/water|rain|splash|spill|stain/.test(t)) return Droplets;
  if (/leather|premium|soft|fabric|stitch|foam|finish|luxur/.test(t)) return Sparkles;
  if (/install|fitting|plug|easy|no drill|mount/.test(t)) return Wrench;
  if (/fit|model|universal|custom|vehicle|car\b/.test(t)) return CarFront;
  if (/vent|cool|breath|air|heat/.test(t)) return Wind;
  if (/sound|bass|speaker|audio|watt|music|clear/.test(t)) return Volume2;
  return CheckCircle2;
}

export function Empty({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="ss-fade mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-dashed border-tint/20 bg-carbon px-8 py-14 text-center">
      {icon && <div className="mb-4 text-dim">{icon}</div>}
      <p className="font-display text-2xl font-extrabold tracking-tight text-chalk">{title}</p>
      {children && <div className="mt-2 text-base text-ash">{children}</div>}
    </div>
  );
}
