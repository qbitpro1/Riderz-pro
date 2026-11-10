import type { Metadata } from "next";
import Link from "next/link";
import { adminPage } from "@/lib/server/admin-auth";
import { buildAdmin, listBuildsAdmin } from "@/lib/server/builds";
import { BuildForm } from "@/components/admin/showcase/BuildForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Builds", robots: { index: false, follow: false, nocache: true } };

export default async function AdminBuildsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await adminPage("catalog", "/admin/builds");
  const sp = await searchParams;
  const [builds, editing] = await Promise.all([listBuildsAdmin(), sp.edit && sp.edit !== "new" ? buildAdmin(sp.edit) : Promise.resolve(null)]);
  const showForm = sp.edit === "new" || editing !== null;
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">BUILDS</h1>
        <p className="mt-3 max-w-3xl text-sm text-ash">
          Finished customer builds shown on /builds, the build page and off-road. Use real builds and the owner&apos;s permission for
          their name; a build needs at least one photo to go live.
        </p>
        <p className="mt-4"><Link href="/admin/builds?edit=new" className="btn btn-primary btn-sm">Add a build</Link></p>

        {showForm && <div className="mt-6"><BuildForm key={editing?.id ?? "new"} build={editing} /></div>}

        <ul className="mt-6 divide-y divide-tint/10 border-y border-tint/10 text-sm">
          {builds.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="font-semibold text-chalk">{b.title}</span>
              <span className="text-ash">{b.vehicle} · {b.tag} · {b.photos.length} photo{b.photos.length === 1 ? "" : "s"}</span>
              <span className={`text-xs font-bold uppercase ${b.status === "live" ? "text-accent" : "text-dim"}`}>{b.status}</span>
              <span className="ml-auto">
                {b.status === "live" && <Link href={`/builds/${b.slug}`} target="_blank" className="mr-3 text-accent underline underline-offset-4">View</Link>}
                <Link href={`/admin/builds?edit=${b.id}`} className="text-accent underline underline-offset-4">Edit</Link>
              </span>
            </li>
          ))}
        </ul>
        {builds.length === 0 && <p className="mt-4 text-sm text-ash">No builds yet. Add the first one above.</p>}
      </div>
    </section>
  );
}
