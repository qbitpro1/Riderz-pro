import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { TrackForm } from "./TrackForm";
import { SITE } from "@/lib/data/site";
import { pageMeta } from "@/lib/data/seo";

export const metadata: Metadata = pageMeta({
  title: "Track Your Order",
  description:
    "See where your Riderzpro order is: live tracking in your account, and updates by SMS and email.",
  path: "/track-order",
});

export default function TrackOrderPage() {
  return (
    <>
      <PageHero
        eyebrow="Customer support"
        title="WHERE IS MY ORDER?"
        blurb="Follow your order live in your account. We also send updates by SMS and email."
        media="mechanicEngine"
        size="sm"
      />
      <section className="section">
        <div className="shell grid max-w-4xl gap-8 md:grid-cols-2 md:items-start">
          <div className="space-y-4 text-sm leading-relaxed text-ash">
            <h2 className="display-3">HOW TRACKING WORKS</h2>
            <p>
              We send you an update by SMS and email when your order is confirmed, picked up and out for delivery. If an
              order stalls for more than 48 hours, we chase it ourselves.
            </p>
            <p>
              Have a Riderzpro account?{" "}
              <Link className="text-accent underline underline-offset-4" href="/account/orders">
                See your orders
              </Link>{" "}
              with each seller&apos;s progress and courier tracking number.
            </p>
            <p>
              Can&apos;t find an update? Send us your order reference or phone number and we will get back to you.
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
