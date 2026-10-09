import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { BookingForm } from "@/components/garage/BookingForm";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { LOCATIONS, SITE, whatsapp } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Contact Riderzpro",
  description:
    "Talk to Riderzpro on WhatsApp or by phone about cars, accessories, builds, audio, PPF, off-road work and workshop bookings across Bengaluru, Hyderabad and Pune.",
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  {
    title: "WhatsApp",
    body: "Fastest route to a human. Fitment questions, quotes, order updates, build photos.",
    action: "Message us",
    href: whatsapp("Hi Riderzpro, "),
    icon: "whatsapp" as const,
    external: true,
  },
  {
    title: "Phone",
    body: `${SITE.phone} · ${SITE.hours}`,
    action: "Call now",
    href: SITE.phoneHref,
    icon: "phone" as const,
    external: true,
  },
  {
    title: "Visit a garage",
    body: "Three workshops, 26 bays. Walk in and look at what's on the lifts.",
    action: "See locations",
    href: "/locations",
    icon: "map" as const,
    external: false,
  },
];

const QUICK_LINKS = [
  { label: "Shipping", href: "/support/shipping" },
  { label: "Returns", href: "/support/returns" },
  { label: "Warranty", href: "/support/warranty" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="TALK TO A HUMAN."
        blurb="No ticket queues, no chatbots. Message us and someone who works in the garage replies — usually inside twenty minutes during business hours."
        media="mechanicEngine"
        size="sm"
      />

      <section className="section">
        <div className="shell">
          <ul className="grid gap-4 md:grid-cols-3">
            {CHANNELS.map((c) => (
              <li key={c.title} className="card flex flex-col p-5">
                <Icon name={c.icon} size={24} className="text-accent" />
                <p className="mt-4 font-display text-lg font-extrabold uppercase">{c.title}</p>
                <p className="mt-2 flex-1 text-sm text-ash">{c.body}</p>
                {c.external ? (
                  <a href={c.href} target="_blank" rel="noreferrer noopener" className="btn btn-outline btn-sm mt-4">
                    {c.action}
                  </a>
                ) : (
                  <Link href={c.href} className="btn btn-outline btn-sm mt-4">
                    {c.action}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-y border-tint/8 bg-carbon">
        <div className="shell grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <SectionHead
              eyebrow="Support"
              title="EVERYTHING ELSE."
              blurb={`Registered office: No. 14, Hosur Main Road, Kudlu Gate, Bengaluru 560068. GSTIN ${SITE.gstin}.`}
            />
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-flex items-center gap-2 text-sm text-ash transition-colors hover:text-accent">
                    <Icon name="chevron" size={12} className="text-accent" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-8 label">Our garages</p>
            <ul className="space-y-3">
              {LOCATIONS.map((l) => (
                <li key={l.slug} className="text-sm text-ash">
                  <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-chalk">
                    {l.city}
                  </span>
                  <br />
                  {l.address}
                </li>
              ))}
            </ul>
          </div>

          <BookingForm />
        </div>
      </section>
    </>
  );
}
