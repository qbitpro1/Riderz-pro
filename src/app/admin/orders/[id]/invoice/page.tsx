import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerInvoice, InvoiceFrame, InvoiceNotice } from "@/components/invoice/CustomerInvoice";
import { adminInvoiceFor } from "@/lib/server/customer-invoice";
import { adminPage } from "@/lib/server/admin-auth";

export const metadata: Metadata = { title: "Tax invoice", robots: { index: false, follow: false, nocache: true } };
export const dynamic = "force-dynamic";

/** [id] is an order id. The customer's Riderzpro tax invoice as the customer sees it (orders.view role). */
export default async function AdminOrderInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await adminPage("orders.view", "/admin/orders");
  const id = (await params).id;
  const found = /^[a-z]+_[A-Za-z0-9_-]{1,64}$/.test(id) ? await adminInvoiceFor(id) : null;
  if (!found) notFound();

  return (
    <InvoiceFrame back={`/admin/orders/${encodeURIComponent(id)}`} backLabel="Back to order" printable={found.state === "issued"}>
      {found.state === "issued" ? (
        <CustomerInvoice inv={found.invoice.snapshot} />
      ) : found.state === "pending" ? (
        <InvoiceNotice
          title="Not issued yet"
          body={`Order ${found.orderNumber} is not confirmed yet. The invoice is issued when it is confirmed or paid.`}
        />
      ) : (
        <InvoiceNotice
          title="No Riderzpro invoice"
          body={`Order ${found.orderNumber} has nothing Riderzpro invoices itself (seller items only with free delivery), or it was cancelled.`}
        />
      )}
    </InvoiceFrame>
  );
}
