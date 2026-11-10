import type { Metadata } from "next";
import Link from "next/link";
import { adminPage } from "@/lib/server/admin-auth";
import { carAdmin, listCarsAdmin } from "@/lib/server/cars";
import { CarForm } from "@/components/admin/showcase/CarForm";
import { lakh } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cars for sale", robots: { index: false, follow: false, nocache: true } };

const TONE: Record<string, string> = { live: "text-accent", sold: "text-gold", draft: "text-dim", archived: "text-dim" };

export default async function AdminCarsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await adminPage("catalog", "/admin/cars");
  const sp = await searchParams;
  const [cars, editing] = await Promise.all([listCarsAdmin(), sp.edit && sp.edit !== "new" ? carAdmin(sp.edit) : Promise.resolve(null)]);
  const showForm = sp.edit === "new" || editing !== null;
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">CARS FOR SALE</h1>
        <p className="mt-3 max-w-3xl text-sm text-ash">
          Riderzpro&apos;s own cars on /cars. Only live cars are for sale; sold ones stay on the site marked sold. A car needs at least
          one photo to go live. The &quot;Riderzpro Verified&quot; badge appears only with a completed workshop inspection on file.
        </p>
        <p className="mt-4"><Link href="/admin/cars?edit=new" className="btn btn-primary btn-sm">Add a car</Link></p>

        {showForm && <div className="mt-6"><CarForm key={editing?.id ?? "new"} car={editing} /></div>}

        <div className="card mt-6 overflow-x-auto p-0">
          <table className="w-full min-w-[40rem] text-left text-xs">
            <thead className="border-b border-tint/10 text-[11px] uppercase tracking-[0.08em] text-dim">
              <tr><th className="px-4 py-3">Car</th><th className="px-3 py-3 text-right">Price</th><th className="px-3 py-3">City</th><th className="px-3 py-3">Status</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-tint/10">
              {cars.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 font-semibold text-chalk">{c.year} {c.brand} {c.model} <span className="font-normal text-ash">{c.variant}</span> <span className="text-dim">· {c.photos.length} photo{c.photos.length === 1 ? "" : "s"}</span></td>
                  <td className="px-3 py-2.5 text-right tnum">{lakh(c.price)}</td>
                  <td className="px-3 py-2.5">{c.city}</td>
                  <td className={`px-3 py-2.5 font-bold uppercase ${TONE[c.status]}`}>{c.status}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    {(c.status === "live" || c.status === "sold") && <Link href={`/cars/${c.slug}`} target="_blank" className="mr-3 text-accent underline underline-offset-4">View</Link>}
                    <Link href={`/admin/cars?edit=${c.id}`} className="text-accent underline underline-offset-4">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cars.length === 0 && <p className="p-5 text-sm text-ash">No cars yet. Add the first one above.</p>}
        </div>
      </div>
    </section>
  );
}
