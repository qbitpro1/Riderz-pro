import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { PrintButton } from "@/components/vendor/orders/PrintButton";
import { fmtDate } from "@/components/vendor/orders/format";
import { rupees } from "@/lib/format";
import { taxByRate, type CustomerInvoiceSnapshot } from "@/lib/invoice/gst";

/**
 * Prints only the document, on A4, black on white whatever the site theme (dark mode included).
 */
const PRINT_CSS = `
@media print {
  :root { color-scheme: light; }
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  .invoice-print, .invoice-print * { visibility: visible !important; }
  .invoice-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 12mm !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; }
  .invoice-print, .invoice-print * { color: #000 !important; background: transparent !important; border-color: #000 !important; }
  .invoice-print table { min-width: 0 !important; }
  .invoice-print tr { break-inside: avoid; }
  .no-print { display: none !important; }
  @page { size: A4; margin: 0; }
}
`;

/** Frame for the invoice pages: back link, print button, then the document or a notice. */
export function InvoiceFrame({ back, backLabel, children, printable }: { back: string; backLabel: string; children: ReactNode; printable: boolean }) {
  return (
    <div className="shell space-y-6 pb-16 pt-28 md:pt-36">
      <style>{PRINT_CSS}</style>
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href={back} className="inline-flex items-center gap-1.5 text-xs text-ash hover:text-accent">
          <ArrowLeft size={14} aria-hidden /> {backLabel}
        </Link>
        {printable && <PrintButton />}
      </div>
      {children}
    </div>
  );
}

export function InvoiceNotice({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-6 text-sm">
      <h1 className="font-display text-xl font-extrabold uppercase">{title}</h1>
      <p className="mt-2 text-ash">{body}</p>
    </div>
  );
}

const pct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`;

export function CustomerInvoice({ inv }: { inv: CustomerInvoiceSnapshot }) {
  const { supplier: s, buyer: b, intraState: intra } = inv;
  const rates = taxByRate(inv.lines);
  const num = "px-2 py-2 text-right tnum";

  return (
    <article className="invoice-print card space-y-6 p-5 text-sm md:p-8" aria-labelledby="inv-h">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-tint/15 pb-4">
        <div>
          <h1 id="inv-h" className="font-display text-2xl font-extrabold uppercase">Tax invoice</h1>
          <p className="mt-1 text-xs text-ash">Original for recipient</p>
        </div>
        <dl className="text-right text-xs">
          <div><dt className="inline text-dim">Invoice no. </dt><dd className="inline font-bold tnum">{inv.number}</dd></div>
          <div><dt className="inline text-dim">Invoice date </dt><dd className="inline tnum">{fmtDate(inv.issuedAt)}</dd></div>
          <div><dt className="inline text-dim">Order </dt><dd className="inline tnum">{inv.order.number} · {fmtDate(inv.order.placedAt)}</dd></div>
        </dl>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="eyebrow mb-2">Sold by</h2>
          <p className="font-semibold">{s.legalName}</p>
          <p className="text-ash">Trading as {s.tradeName}</p>
          <p className="mt-1 text-ash">{s.address}</p>
          <p className="mt-1 text-xs">GSTIN <span className="font-bold tnum">{s.gstin}</span> · State {s.state} ({s.stateCode})</p>
          <p className="mt-1 text-xs text-ash">{s.email} · {s.phone}</p>
        </div>
        <div>
          <h2 className="eyebrow mb-2">Billed and shipped to</h2>
          <p className="font-semibold">{b.name}</p>
          <p className="mt-1 text-ash">
            {b.address}
            <br />
            {b.city}, {b.state} {b.pincode}
          </p>
          <p className="mt-1 text-xs tnum">+91 {b.phone}</p>
          <p className="mt-1 text-xs">
            Place of supply: <span className="font-semibold">{inv.placeOfSupply.state}{inv.placeOfSupply.code ? ` (${inv.placeOfSupply.code})` : ""}</span>
          </p>
          <p className="mt-1 text-xs text-dim">Unregistered buyer (B2C)</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] text-left text-xs">
          <thead>
            <tr className="border-b border-tint/15 uppercase tracking-[0.08em] text-dim">
              <th scope="col" className="py-2 pr-2 font-bold">#</th>
              <th scope="col" className="py-2 pr-2 font-bold">Description</th>
              <th scope="col" className="px-2 py-2 font-bold">HSN/SAC</th>
              <th scope="col" className="px-2 py-2 text-right font-bold">Qty</th>
              <th scope="col" className="px-2 py-2 text-right font-bold">Rate</th>
              <th scope="col" className="px-2 py-2 text-right font-bold">Taxable</th>
              {intra ? (
                <>
                  <th scope="col" className="px-2 py-2 text-right font-bold">CGST</th>
                  <th scope="col" className="px-2 py-2 text-right font-bold">SGST</th>
                </>
              ) : (
                <th scope="col" className="px-2 py-2 text-right font-bold">IGST</th>
              )}
              <th scope="col" className="py-2 pl-2 text-right font-bold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tint/8">
            {inv.lines.map((l, i) => (
              <tr key={i} className="align-top">
                <td className="py-2 pr-2 tnum">{i + 1}</td>
                <td className="py-2 pr-2">
                  {l.title}
                  {l.variant && <span className="block text-dim">{l.variant}</span>}
                  {l.discount ? <span className="block text-dim">Less coupon {inv.coupon?.code ?? ""}: −{rupees(l.discount)}</span> : null}
                </td>
                <td className="px-2 py-2 tnum">{l.hsn ?? "—"}</td>
                <td className={num}>{l.qty}</td>
                <td className={num}>{rupees(l.rate)}</td>
                <td className={num}>{rupees(l.taxable)}</td>
                {intra ? (
                  <>
                    <td className={num}>{rupees(l.cgst)} <span className="text-dim">({pct(l.gstRate / 2)})</span></td>
                    <td className={num}>{rupees(l.sgst)} <span className="text-dim">({pct(l.gstRate / 2)})</span></td>
                  </>
                ) : (
                  <td className={num}>{rupees(l.igst)} <span className="text-dim">({pct(l.gstRate)})</span></td>
                )}
                <td className="py-2 pl-2 text-right font-bold tnum">{rupees(l.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-tint/15 font-bold">
              <td className="py-2 pr-2" colSpan={5}>Total</td>
              <td className={num}>{rupees(inv.totals.taxable)}</td>
              {intra ? (
                <>
                  <td className={num}>{rupees(inv.totals.cgst)}</td>
                  <td className={num}>{rupees(inv.totals.sgst)}</td>
                </>
              ) : (
                <td className={num}>{rupees(inv.totals.igst)}</td>
              )}
              <td className="py-2 pl-2 text-right tnum">{rupees(inv.totals.amount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_16rem]">
        <div className="space-y-2 text-xs">
          <p>
            <span className="text-dim">Amount in words: </span>
            <span className="font-semibold">{inv.amountInWords}</span>
          </p>
          <table className="text-left">
            <thead>
              <tr className="text-dim">
                <th scope="col" className="pr-4 font-bold">GST rate</th>
                <th scope="col" className="pr-4 text-right font-bold">Taxable</th>
                <th scope="col" className="text-right font-bold">Tax</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.rate}>
                  <td className="pr-4 tnum">{pct(r.rate)}{intra ? " (CGST + SGST)" : " (IGST)"}</td>
                  <td className="pr-4 text-right tnum">{rupees(r.taxable)}</td>
                  <td className="text-right tnum">{rupees(r.cgst + r.sgst + r.igst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-dim">Tax payable on reverse charge: No.</p>
        </div>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between gap-4"><dt className="text-dim">Taxable value</dt><dd className="tnum">{rupees(inv.totals.taxable)}</dd></div>
          {intra ? (
            <>
              <div className="flex justify-between gap-4"><dt className="text-dim">CGST</dt><dd className="tnum">{rupees(inv.totals.cgst)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-dim">SGST</dt><dd className="tnum">{rupees(inv.totals.sgst)}</dd></div>
            </>
          ) : (
            <div className="flex justify-between gap-4"><dt className="text-dim">IGST</dt><dd className="tnum">{rupees(inv.totals.igst)}</dd></div>
          )}
          <div className="flex justify-between gap-4 border-t border-tint/15 pt-1 text-sm font-bold"><dt>Invoice total</dt><dd className="tnum">{rupees(inv.totals.amount)}</dd></div>
        </dl>
      </div>

      {inv.sellerItems.length > 0 && (
        <section aria-labelledby="sellers-h" className="space-y-2 border-t border-dashed border-tint/30 pt-4 text-xs">
          <h2 id="sellers-h" className="eyebrow">Also in this order, invoiced by the seller</h2>
          <p className="text-dim">
            These items are sold by marketplace sellers on Riderzpro. Each seller issues its own invoice for them; they are not
            part of this invoice. Order total {rupees(inv.order.total)}.
          </p>
          <ul className="divide-y divide-tint/8">
            {inv.sellerItems.map((i, n) => (
              <li key={n} className="flex justify-between gap-4 py-1.5">
                <span>
                  {i.title}
                  {i.variant ? ` (${i.variant})` : ""} × {i.qty}
                  <span className="block text-dim">Invoiced by {i.seller}</span>
                </span>
                <span className="tnum">{rupees(i.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="space-y-1 border-t border-tint/15 pt-4 text-xs text-dim">
        <p>Prices include GST. Within the same state GST is split into CGST and SGST; between states it is IGST.</p>
        <p>This is a computer-generated invoice and does not need a signature.</p>
        <p className="text-right">For {s.legalName}</p>
      </footer>
    </article>
  );
}
