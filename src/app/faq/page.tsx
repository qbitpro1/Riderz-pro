import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { FaqList } from "./FaqList";
import { FAQ_GROUPS, faqJsonLd } from "@/lib/data/faq";
import { ldJson, pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = pageMeta({
  title: "FAQ — Ordering, Delivery, Returns & Fitment",
  description:
    "Answers on ordering, fitment, delivery, returns, installation, OE parts and payments at the Riderzpro accessories store.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(faqJsonLd()) }}
      />
      <PageHero
        eyebrow="Customer support"
        title="QUESTIONS, ANSWERED."
        blurb="Ordering, fitment, delivery, returns, installation and payments. Each answer links to the policy it comes from."
        media="mechanicEngine"
        size="sm"
        actions={[
          { href: "/track-order", label: "Track your order", variant: "primary" },
          { href: "/contact", label: "Contact us", variant: "outline" },
        ]}
      />

      <section className="section">
        <div className="shell max-w-3xl">
          <nav aria-label="FAQ topics" className="mb-10 flex flex-wrap gap-2">
            {FAQ_GROUPS.map((g) => (
              <a key={g.id} href={`#${g.id}`} className="chip hover:border-accent hover:text-accent">
                {g.title}
              </a>
            ))}
          </nav>

          <div className="space-y-12">
            {FAQ_GROUPS.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-28">
                <h2 className="display-3 mb-4">{g.title.toUpperCase()}</h2>
                <FaqList items={g.items} idPrefix={`faq-${g.id}`} />
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
