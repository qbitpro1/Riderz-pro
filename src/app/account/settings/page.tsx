import type { Metadata } from "next";
import { AccountShell } from "@/components/account/AccountShell";
import { SettingsPanel } from "@/components/account/SettingsPanel";
import { customerPage } from "@/lib/server/customers";

export const metadata: Metadata = { title: "Account settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await customerPage("/account/settings");
  return (
    <AccountShell me={me} title="Settings">
      <SettingsPanel me={me} />
    </AccountShell>
  );
}
