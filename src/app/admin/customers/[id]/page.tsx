import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { adminPage } from "@/lib/server/admin-auth";
import { customerDetailAdmin } from "@/lib/server/admin-reports";
import { rupees } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer", robots: { index: false, follow: false, nocache: true } };

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—");

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage("customers", "/admin/customers");
  const id = (await params).id;
  const c = /^cus_[A-Za-z0-9_-]{6,40}$/.test(id) ? await customerDetailAdmin(id) : null;
  if (!c) notFound();
  const car = c.car ? [c.car.make, c.car.model, c.car.variant, c.car.year].filter(Boolean).join(" ") : null;

  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-4xl">
        <Link href="/admin/customers" className="text-xs text-ash underline underline-offset-4 hover:text-accent">All customers</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2 break-words">{c.name ?? "NO NAME YET"}</h1>
        <p className="mt-3 break-all text-sm text-ash">
          {c.mobile ? `+91 ${c.mobile} (${c.mobileVerified ? "verified" : "not verified"})` : "No mobile"} · {c.email ? `${c.email} (${c.emailVerified ? "verified" : "not verified"})` : "No email"}
        </p>
        <p className="mt-1 text-xs text-dim">
          Joined {when(c.createdAt)} · last sign-in {when(c.lastLoginAt)} · {c.sessions} signed-in device{c.sessions === 1 ? "" : "s"} · {c.wishlist} in wishlist
          {car ? ` · car: ${car}` : ""}
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="card p-5">
            <h2 className="eyebrow mb-3">Orders ({c.orderList.length}) · {rupees(c.spent)} not cancelled</h2>
            {c.orderList.length === 0 ? (
              <p className="text-sm text-ash">No orders yet.</p>
            ) : (
              <ul className="divide-y divide-tint/8 text-sm">
                {c.orderList.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold text-chalk underline-offset-4 hover:text-accent hover:underline">{o.number}</Link>
                    <span className="text-xs text-ash">{when(o.createdAt)} · {o.status} · {o.paymentMethod === "online" ? `online, ${o.paymentStatus.replace("_", " ")}` : o.paymentMethod}</span>
                    <span className="tnum">{rupees(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-6">
            <div className="card p-5 text-sm">
              <h2 className="eyebrow mb-3">Saved addresses ({c.addresses.length})</h2>
              {c.addresses.length === 0 ? (
                <p className="text-ash">None saved.</p>
              ) : (
                <ul className="space-y-2">
                  {c.addresses.map((a, i) => (
                    <li key={i} className="text-xs text-ash">
                      <span className="font-semibold text-chalk">{a.label}</span>{a.isDefault ? " (default)" : ""} · {a.name} · +91 {a.mobile}
                      <br />
                      {a.line}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card p-5 text-sm">
              <h2 className="eyebrow mb-3">Messages ({c.tickets.length})</h2>
              {c.tickets.length === 0 ? (
                <p className="text-ash">None.</p>
              ) : (
                <ul className="space-y-1 text-xs text-ash">
                  {c.tickets.map((t) => (
                    <li key={t.id}>
                      {when(t.createdAt)} · {t.topic} · {t.status}
                      {t.orderNumber ? ` · ${t.orderNumber}` : ""}
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/admin/customer-support" className="mt-3 inline-block text-xs font-semibold text-accent underline underline-offset-4">Open the help desk</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
