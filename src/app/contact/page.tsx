import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { BookingForm } from "@/components/garage/BookingForm";
import { HelpForm } from "@/components/account/HelpForm";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { LOCATIONS, SITE } from "@/lib/data/site";
import { pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = pageMeta({
  title: "Contact Riderzpro",
  description:
    "Talk to Riderzpro by message, phone or email about accessories, fitment, orders, audio, PPF, off-road work and installation bookings.",
  path: "/contact",
});

const CHANNELS = [
  {
    title: "Message",
    body: "Fitment questions, quotes and order updates. We reply within one working day.",
    action: "Send a message",
    href: "#message",
    icon: "spark" as const,
    external: false,
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
    title: "Email",
    body: SITE.email,
    action: "Write to us",
    href: `mailto:${SITE.email}`,
    icon: "mail" as const,
    external: true,
  },
];

const ORDER_SUPPORT = [
  { label: "Frequently asked questions", href: "/faq" },
  { label: "Track your order", href: "/track-order" },
  { label: "Shipping & delivery", href: "/support/shipping" },
  { label: "Returns & refunds", href: "/support/returns" },
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
        title="Talk to a human"
        blurb="No ticket queues, no chatbots. Message us and someone from our team replies — usually inside twenty minutes during business hours."
        media="mechanicEngine"
        size="sm"
      />

      <section className="section pb-0">
        <div className="shell">
          <p className="label">Order support</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {ORDER_SUPPORT.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="chip hover:border-accent hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

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
              title="Everything else"
              blurb={`${SITE.legalName}${SITE.registeredOffice ? ` Registered office: ${SITE.registeredOffice}.` : ""} GSTIN ${SITE.gstin}.`}
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

            {LOCATIONS.length > 0 && (
              <>
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
              </>
            )}
          </div>

          <div className="space-y-6">
            <div id="message" className="scroll-mt-28">
              <HelpForm />
            </div>
            <BookingForm />
          </div>
        </div>
      </section>
    </>
  );
}
