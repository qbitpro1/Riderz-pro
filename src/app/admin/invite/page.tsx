import type { Metadata } from "next";
import Link from "next/link";
import { AcceptInviteForm } from "@/components/admin/team/AcceptInviteForm";
import { inviteByToken } from "@/lib/server/admin-auth";
import { ROLE_LABELS } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin team invite", robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };

/** Opened from a one-time invite or password-reset link. */
export default async function AdminInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const invite = await inviteByToken(token);
  return (
    <section className="section pt-24 md:pt-32">
      <div className="shell max-w-md">
        <p className="eyebrow mb-3">Internal · not indexed</p>
        <h1 className="display-2">{invite?.kind === "reset" ? "NEW PASSWORD" : "JOIN THE TEAM"}</h1>
        {invite ? (
          <>
            <p className="mt-3 text-sm text-ash">
              {invite.kind === "invite" ? `You're invited as ${ROLE_LABELS[invite.role]}. Choose a password to finish.` : "Choose a new password. Other signed-in browsers will be signed out."}
            </p>
            <div className="mt-6">
              <AcceptInviteForm token={token} email={invite.email} name={invite.name} kind={invite.kind} />
            </div>
          </>
        ) : (
          <div className="card mt-6 p-5 text-sm text-ash">
            <p>This link has expired, was already used or was cancelled. Ask the owner for a new one.</p>
            <Link href="/admin/sign-in" className="mt-3 inline-block font-semibold text-accent underline underline-offset-4">Go to sign in</Link>
          </div>
        )}
      </div>
    </section>
  );
}
