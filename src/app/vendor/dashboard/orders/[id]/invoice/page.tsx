import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/vendor/orders/PrintButton";
import { fmtDate } from "@/components/vendor/orders/format";
import { invoiceLines, sameState } from "@/components/vendor/orders/invoice";
import { rupees } from "@/lib/format";
import { vendorOrderDetail } from "@/lib/server/orders";
import { vendorPage } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Packing slip & invoice", robots: { index: false, follow: false } };

/** Hides everything but the document when printing, and prints in black on white whatever the site theme. */
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  .invoice-print, .invoice-print * { visibility: visible !important; }
  .invoice-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 12mm !important; border: 0 !important; box-shadow: none !important; }
  .invoice-print, .invoice-print * { color: black !important; background: transparent !important; border-color: black !important; }
  .invoice-print .page-break { break-before: page; }
  .no-print { display: none !important; }
  @page { size: A4; margin: 0; }
}
`;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vendor = await vendorPage(["approved", "suspended"], `/vendor/dashboard/orders/${id}/invoice`);
  const order = await vendorOrderDetail(vendor.id, id);
  if (!order) notFound();

  const tax = vendor.onboarding.tax;
  const pickup = vendor.onboarding.shipping?.pickup;
  const gstExempt = tax?.gstExempt ?? true;
  const intra = sameState(pickup?.state, order.state);
  const lines = invoiceLines(order.items, { gstExempt, intraState: intra });
  const sum = (k: "taxable" | "cgst" | "sgst" | "igst" | "amount") => lines.reduce((n, l) => n + l[k], 0);
  const invoiceNo = `${order.number}-${vendor.slug ?? "seller"}`;
  const invoiceDate = order.shippedAt ?? order.acceptedAt ?? order.createdAt;
  const sellerName = tax?.tradeName || tax?.legalName || vendor.storeName || "Seller";

  return (
    <div className="space-y-6">
      <style>{PRINT_CSS}</style>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={`/vendor/dashboard/orders/${order.id}`} className="inline-flex items-center gap-1.5 text-xs text-ash hover:text-accent">
          <ArrowLeft size={14} aria-hidden /> Back to order
        </Link>
        <PrintButton />
      </div>

      <article className="invoice-print card space-y-8 p-5 text-sm md:p-8">
        {/* ------------------------------------------------ invoice */}
        <section aria-labelledby="inv-h" className="space-y-5">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-tint/15 pb-4">
            <div>
              <h1 id="inv-h" className="font-display text-2xl font-extrabold uppercase">
                {gstExempt ? "Bill of supply" : "Tax invoice"}
              </h1>
              <p className="mt-1 text-xs text-ash">Sold through Riderzpro</p>
            </div>
            <dl className="text-right text-xs">
              <div><dt className="inline text-dim">Invoice no. </dt><dd className="inline font-bold tnum">{invoiceNo}</dd></div>
              <div><dt className="inline text-dim">Invoice date </dt><dd className="inline tnum">{fmtDate(invoiceDate)}</dd></div>
              <div><dt className="inline text-dim">Order </dt><dd className="inline tnum">{order.number} · {fmtDate(order.createdAt)}</dd></div>
            </dl>
          </header>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="eyebrow mb-2">Sold by</h2>
              <p className="font-semibold">{sellerName}</p>
              {tax?.legalName && tax.legalName !== sellerName && <p className="text-ash">{tax.legalName}</p>}
              {pickup && (
                <p className="mt-1 text-ash">
                  {pickup.line1}
                  {pickup.line2 ? `, ${pickup.line2}` : ""}
                  <br />
                  {pickup.city}, {pickup.state} {pickup.pincode}
                </p>
              )}
              <p className="mt-1 text-xs">
                {gstExempt || !tax?.gstin ? "GST-exempt seller" : <>GSTIN <span className="font-bold tnum">{tax.gstin}</span></>}
              </p>
            </div>
            <div>
              <h2 className="eyebrow mb-2">Billed and shipped to</h2>
              <p className="font-semibold">{order.customerName}</p>
              <p className="mt-1 text-ash">
                {order.address}
                <br />
                {order.city}, {order.state} {order.pincode}
              </p>
              <p className="mt-1 text-xs tnum">+91 {order.customerPhone}</p>
              <p className="mt-1 text-xs text-dim">Place of supply: {order.state}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-xs">
              <thead>
                <tr className="border-b border-tint/15 uppercase tracking-[0.08em] text-dim">
                  <th scope="col" className="py-2 pr-2 font-bold">Item</th>
                  <th scope="col" className="px-2 py-2 font-bold">HSN</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">Qty</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">Rate</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">Taxable</th>
                  {!gstExempt && (intra ? (
                    <>
                      <th scope="col" className="px-2 py-2 text-right font-bold">CGST</th>
                      <th scope="col" className="px-2 py-2 text-right font-bold">SGST</th>
                    </>
                  ) : (
                    <th scope="col" className="px-2 py-2 text-right font-bold">IGST</th>
                  ))}
                  <th scope="col" className="py-2 pl-2 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tint/8">
                {lines.map((l, i) => (
                  <tr key={i} className="align-top">
                    <td className="py-2 pr-2">
                      {l.title}
                      {l.variant && <span className="block text-dim">{l.variant}</span>}
                    </td>
                    <td className="px-2 py-2 tnum">{l.hsn ?? "—"}</td>
                    <td className="px-2 py-2 text-right tnum">{l.qty}</td>
                    <td className="px-2 py-2 text-right tnum">{rupees(l.rate)}</td>
                    <td className="px-2 py-2 text-right tnum">{rupees(l.taxable)}</td>
                    {!gstExempt && (intra ? (
                      <>
                        <td className="px-2 py-2 text-right tnum">{rupees(l.cgst)} <span className="text-dim">({l.gstRate / 2}%)</span></td>
                        <td className="px-2 py-2 text-right tnum">{rupees(l.sgst)} <span className="text-dim">({l.gstRate / 2}%)</span></td>
                      </>
                    ) : (
                      <td className="px-2 py-2 text-right tnum">{rupees(l.igst)} <span className="text-dim">({l.gstRate}%)</span></td>
                    ))}
                    <td className="py-2 pl-2 text-right font-bold tnum">{rupees(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-tint/15 font-bold">
                  <td className="py-2 pr-2" colSpan={4}>Total</td>
                  <td className="px-2 py-2 text-right tnum">{rupees(sum("taxable"))}</td>
                  {!gstExempt && (intra ? (
                    <>
                      <td className="px-2 py-2 text-right tnum">{rupees(sum("cgst"))}</td>
                      <td className="px-2 py-2 text-right tnum">{rupees(sum("sgst"))}</td>
                    </>
                  ) : (
                    <td className="px-2 py-2 text-right tnum">{rupees(sum("igst"))}</td>
                  ))}
                  <td className="py-2 pl-2 text-right tnum">{rupees(sum("amount"))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-dim">
            Prices include GST. {gstExempt ? "The seller is not registered for GST, so no tax is charged." : "Shipping charged by Riderzpro is invoiced separately."} This is a computer-generated document.
          </p>
        </section>

        {/* ------------------------------------------- packing slip */}
        <section aria-labelledby="slip-h" className="page-break space-y-4 border-t border-dashed border-tint/30 pt-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="slip-h" className="font-display text-xl font-extrabold uppercase">Packing slip</h2>
              <p className="mt-1 text-xs text-ash">Order {order.number}</p>
            </div>
            <p className="text-xs text-dim tnum">{fmtDate(order.createdAt)}</p>
          </header>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="eyebrow mb-2">Ship to</h3>
              <p className="font-semibold">{order.customerName}</p>
              <p className="text-ash">
                {order.address}
                <br />
                {order.city}, {order.state} {order.pincode}
              </p>
              <p className="mt-1 text-xs tnum">+91 {order.customerPhone}</p>
            </div>
            <div>
              <h3 className="eyebrow mb-2">Return address</h3>
              <p className="font-semibold">{sellerName}</p>
              {pickup && (
                <p className="text-ash">
                  {pickup.line1}
                  {pickup.line2 ? `, ${pickup.line2}` : ""}
                  <br />
                  {pickup.city}, {pickup.state} {pickup.pincode}
                </p>
              )}
            </div>
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-tint/15 uppercase tracking-[0.08em] text-dim">
                <th scope="col" className="py-2 pr-2 font-bold">Item</th>
                <th scope="col" className="py-2 pl-2 text-right font-bold">Qty</th>
                <th scope="col" className="py-2 pl-2 text-right font-bold">Packed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tint/8">
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td className="py-2 pr-2">
                    {i.title}
                    {i.variant && <span className="block text-dim">{i.variant}</span>}
                  </td>
                  <td className="py-2 pl-2 text-right font-bold tnum">{i.qty}</td>
                  <td className="py-2 pl-2 text-right">☐</td>
                </tr>
              ))}
            </tbody>
          </table>
          {order.notes && <p className="text-xs text-ash">Customer note: {order.notes}</p>}
        </section>
      </article>
    </div>
  );
}
