import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { SystemForm } from "@/components/recoil/SystemForm";
import { ProductShot } from "@/components/recoil/RecoilCard";
import { toPublic } from "@/lib/data/recoil";
import { buildSystem, BUDGETS, GOALS, type Budget, type Goal } from "@/lib/data/recoil/system-builder";
import { findModel } from "@/lib/data/vehicles";
import { rupees } from "@/lib/format";
import { whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Build My Audio System — RECOIL, Costed to Your Budget",
  description:
    "Pick a budget, your car and what you want from the system. Motorbotz builds a matched RECOIL specification — amplifier, speakers, subwoofer, processing, damping and wiring — with a real total.",
  alternates: { canonical: "/build-audio" },
};

type Params = Promise<{ budget?: string; goal?: string; brand?: string; model?: string; year?: string }>;

export default async function BuildAudioPage({ searchParams }: { searchParams: Params }) {
  const sp = await searchParams;

  const budget = BUDGETS.find((b) => String(b.value) === sp.budget)?.value ?? null;
  const goal = GOALS.find((g) => g.value === sp.goal)?.value ?? null;
  const vehicleModel = sp.brand && sp.model ? findModel(sp.brand, sp.model) : undefined;
  const vehicle = vehicleModel ? `${sp.year ? `${sp.year} ` : ""}${vehicleModel.brand} ${vehicleModel.name}` : null;

  const system = budget && goal ? buildSystem(budget as Budget, goal as Goal, vehicle) : null;
  const goalMeta = GOALS.find((g) => g.value === goal);

  return (
    <>
      <PageHero
        eyebrow="Build my audio system"
        title="TELL US WHAT YOU WANT IT TO DO."
        blurb="Budget, car, goal. We put together a RECOIL specification that actually works as a system — and tell you when the honest answer is that your budget buys fewer, better parts."
        media="studioMonitors"
        size="sm"
      />

      <section className="section">
        <div className="shell grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <Suspense fallback={<div className="card h-96 animate-pulse" />}>
            <SystemForm />
          </Suspense>

          <div className="card p-5 md:p-6">
            <p className="eyebrow mb-3">How we choose</p>
            <ul className="space-y-3">
              {[
                "Every part comes from the RECOIL price list we actually stock — nothing aspirational.",
                "Slots are filled in the order that matters: source and front stage before bass, always.",
                "If a subwoofer goes in, so does an amplifier that can drive it. We do not sell orphan parts.",
                "Deadening is in every system above the entry budget, because it is the cheapest real gain there is.",
                "If the budget cannot carry the goal, we say so rather than shipping a compromised system.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-ash">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-accent" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-white/8 pt-4 text-xs leading-relaxed text-dim">
              Enclosure design, adapter rings, harnesses and labour are quoted after we see the car.
              The figure below is parts only.
            </p>
          </div>
        </div>
      </section>

      {system && (
        <section className="section scroll-mt-24 border-y border-white/8 bg-carbon" id="system">
          <div className="shell">
            <SectionHead
              eyebrow={`${goalMeta?.label} · ${rupees(budget!)} budget${vehicle ? ` · ${vehicle}` : ""}`}
              title="YOUR SYSTEM."
              blurb={goalMeta?.blurb}
            />

            <ul className="space-y-3">
              {system.slots.map((slot) => (
                <li key={slot.key}>
                  {slot.product ? (
                    <div className="card grid gap-4 p-4 sm:grid-cols-[128px_1fr] sm:items-center">
                      <Link
                        href={`/products/${slot.product.slug}`}
                        className="relative mx-auto block aspect-square w-32 overflow-hidden bg-[#f3f4f5]"
                      >
                        <ProductShot product={toPublic(slot.product)} sizes="128px" />
                      </Link>
                      <div>
                        <p className="eyebrow">{slot.label}</p>
                        <Link
                          href={`/products/${slot.product.slug}`}
                          className="mt-1 block font-display text-lg font-extrabold uppercase tracking-[-0.02em] transition-colors hover:text-accent"
                        >
                          {slot.product.sku}
                        </Link>
                        <p className="mt-0.5 text-sm text-ash">{slot.product.priceListName}</p>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-dim">{slot.reason}</p>
                        <p className="mt-3 font-display text-xl font-extrabold tnum">
                          {slot.product.sellingPrice ? rupees(slot.product.sellingPrice) : "—"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="card border-dashed p-4">
                      <p className="eyebrow">{slot.label}</p>
                      <p className="mt-1 text-sm text-ash">{slot.skipped}</p>
                      <p className="mt-1 text-xs text-dim">{slot.reason}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <div className="card mt-6 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="label mb-1">Parts total</p>
                  <p className="font-display text-4xl font-extrabold tracking-[-0.04em] tnum">
                    {rupees(system.total)}
                  </p>
                  <p className="mt-1 text-xs text-dim">
                    {system.withinBudget
                      ? `Inside your ${rupees(budget!)} budget.`
                      : `Above your ${rupees(budget!)} budget — see the note below.`}
                  </p>
                </div>
                <a
                  href={whatsapp(
                    [
                      "Hi Motorbotz, I built an audio system on the website:",
                      "",
                      ...system.slots
                        .filter((s) => s.product)
                        .map((s) => `• ${s.label}: ${s.product!.sku} — ${s.product!.priceListName} (${rupees(s.product!.sellingPrice ?? 0)})`),
                      "",
                      `Parts total: ${rupees(system.total)}`,
                      `Goal: ${goalMeta?.label}`,
                      vehicle ? `Car: ${vehicle}` : "Car: ",
                      "Please quote installation and confirm fitment.",
                    ].join("\n"),
                  )}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-whatsapp"
                >
                  <Icon name="whatsapp" size={16} />
                  Get this quoted
                </a>
              </div>

              {system.notes.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-white/8 pt-4">
                  {system.notes.map((n) => (
                    <li key={n} className="flex items-start gap-2.5 text-xs leading-relaxed text-dim">
                      <Icon name="shield" size={13} className="mt-0.5 shrink-0 text-gold" />
                      {n}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/audio" className="btn btn-outline btn-sm">
                See our installed packages
              </Link>
              <Link href="/recoil" className="btn btn-outline btn-sm">
                Browse the full catalogue
              </Link>
            </div>
          </div>
        </section>
      )}

      {!system && (
        <section className="section border-t border-white/8 bg-carbon">
          <div className="shell">
            <SectionHead
              eyebrow="Or start from a fitted package"
              title="PREFER US TO JUST DO IT?"
              blurb="Four installed packages from ₹24,900 to ₹4,50,000 — parts, labour, deadening and tuning included."
              href="/audio"
              hrefLabel="Audio packages"
            />
          </div>
        </section>
      )}
    </>
  );
}
