import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/PageHero";
import { StickyPpfCta } from "@/components/ppf/StickyPpfCta";
import { Icon } from "@/components/ui/Icon";
import { GUIDE, getArticle } from "@/lib/ppf/guide";
import { whatsapp } from "@/lib/data/site";

export function generateStaticParams() {
  return GUIDE.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/ppf/guide/${article.slug}` },
  };
}

export default async function PpfGuideArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: article.question,
        acceptedAnswer: { "@type": "Answer", text: article.summary },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="section pt-24 md:pt-32">
        <div className="shell max-w-3xl">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "PPF", href: "/ppf" },
              { label: "Guide", href: "/ppf/guide" },
              { label: article.title },
            ]}
          />
          <p className="eyebrow mb-3">PPF guide</p>
          <h1 className="display-2">{article.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-ash md:text-base">{article.summary}</p>

          <div className="mt-10 space-y-8">
            {article.body.map((block, i) => (
              <section key={i}>
                {block.heading && <h2 className="display-3">{block.heading.toUpperCase()}</h2>}
                <p className={`text-sm leading-relaxed text-ash md:text-base ${block.heading ? "mt-3" : ""}`}>
                  {block.text}
                </p>
              </section>
            ))}
          </div>

          {article.related.length > 0 && (
            <div className="mt-12 border-t border-tint/8 pt-6">
              <p className="label">Related</p>
              <ul className="flex flex-wrap gap-2">
                {article.related.map((slug) => {
                  const rel = getArticle(slug);
                  if (!rel) return null;
                  return (
                    <li key={slug}>
                      <Link href={`/ppf/guide/${slug}`} className="chip hover:border-accent hover:text-accent">
                        {rel.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="card mt-10 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-display text-base font-extrabold uppercase">Still deciding?</p>
              <p className="mt-1 text-sm text-ash">Build a package and see an indicative price.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/ppf/quote" className="btn btn-accent btn-sm">
                Get PPF quote
                <Icon name="arrow" size={14} />
              </Link>
              <a
                href={whatsapp("Hi Riderzpro, I have a PPF question: ")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-whatsapp btn-sm"
              >
                <Icon name="whatsapp" size={15} />
                Ask us
              </a>
            </div>
          </div>
        </div>
      </section>

      <StickyPpfCta />
    </>
  );
}
