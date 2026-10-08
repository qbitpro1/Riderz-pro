import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Breadcrumbs } from "./PageHero";
import { SITE, whatsapp } from "@/lib/data/site";
import type { Policy } from "@/lib/data/policies";

export function PolicyPage({ policy, parent }: { policy: Policy; parent: { label: string; href: string } }) {
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-3xl">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, parent, { label: policy.title }]}
        />
        <p className="eyebrow mb-3">{policy.eyebrow}</p>
        <h1 className="display-2">{policy.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-ash md:text-base">{policy.intro}</p>

        <div className="mt-10 space-y-9">
          {policy.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="display-3">{s.heading.toUpperCase()}</h2>
              <div className="mt-3 space-y-3">
                {s.body.map((p) => (
                  <p key={p} className="text-sm leading-relaxed text-ash">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="card mt-12 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-base font-extrabold uppercase">Still need a hand?</p>
            <p className="mt-1 text-sm text-ash">
              {SITE.email} · {SITE.phone}
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href={whatsapp("Hi Riderzpro, I have a support question about ")}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whatsapp btn-sm"
            >
              <Icon name="whatsapp" size={15} />
              WhatsApp support
            </a>
            <Link href="/contact" className="btn btn-outline btn-sm">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
