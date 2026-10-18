"use client";

import Link from "next/link";
import { whatsapp } from "@/lib/data/site";

/** Something failed while showing this page. The header, footer and cart stay usable around it. */
export default function PageError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section className="section">
      <div className="shell max-w-2xl py-16 text-center md:py-24">
        <p className="eyebrow mb-4">Something went wrong</p>
        <h1 className="display-2">THIS PAGE DIDN&apos;T LOAD.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm text-ash md:text-base">
          It&apos;s on our side, not yours. Try again; if it keeps happening, message us and we&apos;ll sort it out.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => retry()} className="btn btn-primary">
            Try again
          </button>
          <Link href="/" className="btn btn-outline">
            Back home
          </Link>
          <a
            href={whatsapp(`Hi Riderzpro, a page didn't load for me.${error.digest ? ` (ref ${error.digest})` : ""}`)}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-whatsapp"
          >
            WhatsApp us
          </a>
        </div>
        {error.digest && <p className="mt-6 text-xs text-dim">Reference: {error.digest}</p>}
      </div>
    </section>
  );
}
