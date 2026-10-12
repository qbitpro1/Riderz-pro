import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { TrackForm } from "./TrackForm";
import { SITE } from "@/lib/data/site";
import { pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = pageMeta({
  title: "Track Your Order",
  description:
    "Orders are confirmed on WhatsApp and tracking details are sent there. Ask where your Riderzpro order is.",
  path: "/track-order",
});

export default function TrackOrderPage() {
  return (
    <>
      <PageHero
        eyebrow="Customer support"
        title="WHERE IS MY ORDER?"
        blurb="Orders are confirmed on WhatsApp, and tracking details are sent to you there."
        media="mechanicEngine"
        size="sm"
      />
      <section className="section">
        <div className="shell grid max-w-4xl gap-8 md:grid-cols-2 md:items-start">
          <div className="space-y-4 text-sm leading-relaxed text-ash">
            <h2 className="display-3">HOW TRACKING WORKS</h2>
            <p>
              You receive a tracking link on WhatsApp when your consignment is picked up, and again when it is out for
              delivery. If a consignment stalls for more than 48 hours, we chase the carrier ourselves.
            </p>
            <p>
              Cannot find the message? Send us your order reference or phone number and we will reply on WhatsApp.
            </p>
            <p>
              Or reach us directly: <a className="text-accent underline underline-offset-4" href={SITE.phoneHref}>{SITE.phone}</a>
              {" · "}
              <a className="text-accent underline underline-offset-4" href={`mailto:${SITE.email}`}>{SITE.email}</a>
              <br />
              {SITE.hours}
            </p>
            <p>
              See also{" "}
              <Link href="/support/shipping#tracking" className="text-accent underline underline-offset-4">
                shipping and tracking
              </Link>{" "}
              and the{" "}
              <Link href="/faq" className="text-accent underline underline-offset-4">
                FAQ
              </Link>
              .
            </p>
          </div>
          <TrackForm />
        </div>
      </section>
    </>
  );
}
