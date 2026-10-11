import Link from "next/link";
import { DEPARTMENTS, departmentHref } from "@/lib/data/taxonomy";
import { Icon } from "@/components/ui/Icon";

export default function NotFound() {
  return (
    <section className="section">
      <div className="shell max-w-3xl py-16 text-center md:py-24">
        <p className="eyebrow mb-4">404 · Page not found</p>
        <h1 className="display-1">NOT ON THIS SHELF.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm text-ash md:text-base">
          That page has moved or never existed. Search the shop or pick a department.
        </p>

        <form action="/shop" method="get" role="search" className="mx-auto mt-8 flex max-w-md gap-2">
          <label htmlFor="nf-q" className="sr-only">
            Search accessories
          </label>
          <input
            id="nf-q"
            name="q"
            type="search"
            placeholder="Search seat covers, speakers, lights…"
            className="min-w-0 flex-1 border border-tint/20 bg-carbon px-4 py-3 text-sm text-chalk placeholder:text-dim"
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {DEPARTMENTS.map((d) => (
            <li key={d.slug}>
              <Link href={departmentHref(d.slug)} className="chip hover:border-accent hover:text-accent">
                {d.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            Shop all accessories
            <Icon name="arrow" size={15} />
          </Link>
          <Link href="/" className="btn btn-outline">
            Back home
          </Link>
        </div>
      </div>
    </section>
  );
}
