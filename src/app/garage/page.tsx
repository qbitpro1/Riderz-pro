import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { BookingForm } from "@/components/garage/BookingForm";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { GARAGE_SERVICES } from "@/lib/data/services";
import { SITE } from "@/lib/data/site";
import { pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = pageMeta({
  title: "Installation & Service — Riderzpro",
  description:
    "Book installation, modification, detailing, PPF, audio, performance, off-road and interior work with Riderzpro. We call you to confirm the slot and the fitment.",
  path: "/garage",
});


export default async function GaragePage() {
  return (
    <>
      <PageHero
        eyebrow="Riderzpro Garage"
        title="Installation & service"
        blurb="Tell us what your car needs. We call you to confirm the slot and the fitment before any work starts."
        media="mechanicEngine"
        actions={[{ href: "#book", label: "Book an appointment", variant: "primary" }]}
      />

      <section className="section">
        <div className="shell grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-start" id="book">
          <div>
            <SectionHead
              eyebrow="What we do"
              title="What we can do"
              blurb="If we cannot do something properly, we say so instead of learning on your car."
            />
            {/* An odd last service spans both columns, so the grid never ends on an empty cell. */}
            <ul className="grid gap-px overflow-hidden border border-tint/8 bg-tint/8 sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2">
              {GARAGE_SERVICES.map((s) => (
                <li key={s.name} className="bg-void p-4">
                  <p className="flex items-center gap-2 font-display text-sm font-extrabold uppercase">
                    <Icon name="wrench" size={14} className="text-accent" />
                    {s.name}
                  </p>
                  <p className="mt-1.5 text-xs text-ash">{s.blurb}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/build" className="btn btn-accent btn-sm">
                Configure a build before you come in
                <Icon name="arrow" size={14} />
              </Link>
              <p className="text-sm text-dim">{SITE.hours}</p>
            </div>
          </div>

          <BookingForm />
        </div>
      </section>


      <section className="section">
        <div className="shell">
          <SectionHead eyebrow="Talk to us" title="Book a slot" blurb="Call or message us to book a slot." />
          <a href={SITE.phoneHref} className="btn btn-outline btn-sm">
            <Icon name="phone" size={13} />
            {SITE.phone}
          </a>
          <p className="mt-6 text-sm text-dim">{SITE.hours}</p>
          <Link href="/build" className="btn btn-accent btn-sm mt-6">
            Configure a build
            <Icon name="arrow" size={14} />
          </Link>
        </div>
      </section>
    </>
  );
}
