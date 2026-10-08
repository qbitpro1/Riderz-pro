import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { StickyPpfCta } from "@/components/ppf/StickyPpfCta";
import { SectionHead } from "@/components/ui/Section";
import { Icon } from "@/components/ui/Icon";
import { GUIDE } from "@/lib/ppf/guide";

export const metadata: Metadata = {
  title: "PPF Guide — Paint Protection Film Explained",
  description:
    "Straight answers on paint protection film: what it is, PPF vs ceramic coating, how long it lasts, whether it damages paint, gloss vs matte, maintenance, removal and warranty.",
  alternates: { canonical: "/ppf/guide" },
};

export default function PpfGuidePage() {
  return (
    <>
      <PageHero
        eyebrow="PPF guide"
        title="STRAIGHT ANSWERS."
        blurb="Written to answer the question, not to rank for it. Where a claim depends on a specific film, we say so and point you at that film's warranty."
        media="detailingPolish"
        size="sm"
      />

      <section className="section">
        <div className="shell">
          <SectionHead eyebrow={`${GUIDE.length} articles`} title="EVERYTHING PEOPLE ASK US." />
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {GUIDE.map((article) => (
              <li key={article.slug}>
                <Link href={`/ppf/guide/${article.slug}`} className="card card-hover flex h-full flex-col p-5">
                  <p className="font-display text-base font-extrabold uppercase tracking-[-0.01em]">{article.title}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ash">{article.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-accent">
                    Read
                    <Icon name="arrow" size={13} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StickyPpfCta />
    </>
  );
}
