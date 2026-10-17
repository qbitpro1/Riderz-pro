import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { AddressBook } from "@/components/account/AddressBook";
import { customerPage, listAddresses } from "@/lib/server/customers";

export const metadata: Metadata = { title: "Your addresses", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const me = await customerPage("/account/addresses");
  const addresses = await listAddresses(me.id);
  return (
    <AccountShell me={me} title="Your addresses">
      <AddressBook initial={addresses} name={me.name ?? ""} mobile={me.mobile ?? ""} />
    </AccountShell>
  );
}
