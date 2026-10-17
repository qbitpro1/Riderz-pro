import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerInvoice, InvoiceFrame, InvoiceNotice } from "@/components/invoice/CustomerInvoice";
import { customerInvoiceFor } from "@/lib/server/customer-invoice";
import { customerPage } from "@/lib/server/customers";

export const metadata: Metadata = { title: "Tax invoice", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ number: string }> };

/** The customer's GST tax invoice for Riderzpro's part of one of their own orders. */
export default async function OrderInvoicePage({ params }: Params) {
  const number = (await params).number.toUpperCase();
  const me = await customerPage(`/account/orders/${encodeURIComponent(number)}/invoice`);
  const found = /^RZP-[A-Z0-9]{6}$/.test(number) ? await customerInvoiceFor(me.id, number) : null;
  if (!found) notFound();

  return (
    <InvoiceFrame back={`/account/orders/${encodeURIComponent(number)}`} backLabel="Back to order" printable={found.state === "issued"}>
      {found.state === "issued" ? (
        <CustomerInvoice inv={found.invoice.snapshot} />
      ) : found.state === "pending" ? (
        <InvoiceNotice
          title="Invoice not ready yet"
          body="Your tax invoice is issued once the order is confirmed. Check back after you get the confirmation."
        />
      ) : (
        <InvoiceNotice
          title="No Riderzpro invoice"
          body="There is no Riderzpro invoice for this order. Items from marketplace sellers are invoiced by the seller, and cancelled orders are not invoiced."
        />
      )}
    </InvoiceFrame>
  );
}
