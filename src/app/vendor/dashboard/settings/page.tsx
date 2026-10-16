import type { Metadata } from "next";
import SettingsForm from "@/components/vendor/settings/SettingsForm";
import { vendorPage } from "@/lib/server/session";
import { getSettings } from "@/lib/server/vendor-account";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const vendor = await vendorPage(["approved", "suspended"], "/vendor/dashboard/settings");
  const settings = await getSettings(vendor);
  return (
    <>
      <h1 className="display-3">SETTINGS</h1>
      <p className="mt-2 max-w-2xl text-sm text-ash">Your store profile, shipping, payout account and sign-in.</p>
      <SettingsForm initial={settings} />
    </>
  );
}
