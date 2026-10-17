import type { Metadata } from "next";
import Link from "next/link";
import { TeamBoard } from "@/components/admin/team/TeamBoard";
import { adminPage, listTeam } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin team", robots: { index: false, follow: false, nocache: true } };

/** Owner only: team logins, roles, invite and reset links. */
export default async function AdminTeamPage() {
  const me = await adminPage("team", "/admin/team");
  const { members, invites } = await listTeam();
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-3xl">
        <Link href="/admin" className="text-xs text-ash underline underline-offset-4 hover:text-accent">Admin</Link>
        <p className="eyebrow mb-3 mt-4">Internal · not indexed</p>
        <h1 className="display-2">TEAM</h1>
        <p className="mt-3 text-sm text-ash">
          Everyone signs in with their own email and password. Each role opens only its own tools; every sign-in and change is in the audit log.
        </p>
        <div className="mt-8">
          <TeamBoard meId={me.id} members={members} invites={invites} />
        </div>
      </div>
    </section>
  );
}
