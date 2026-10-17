"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiFailure } from "@/lib/vendor/client";
import { ADMIN_ROLES, ROLE_LABELS, ROLE_TEXT, type AdminRole, type TeamInvite, type TeamMember } from "@/lib/admin/roles";

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "Never";

/** A one-time link, shown once so the owner can send it (it is also emailed when email is set up). */
function LinkBox({ link, emailed, onClose }: { link: string; emailed: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <div role="status" className="card space-y-2 border-accent/40 p-4 text-sm">
      <p className="font-semibold text-chalk">One-time link (works for 72 hours, shown only now)</p>
      <p className="break-all rounded-sm bg-tint/5 p-2 font-mono text-xs text-ash">{link}</p>
      <p className="text-xs text-dim">{emailed ? "It was also emailed to them." : "Email isn't set up yet, so send it yourself (WhatsApp or email)."}</p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={async () => {
            await navigator.clipboard.writeText(link).catch(() => undefined);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

export function TeamBoard({ meId, members, invites }: { meId: string; members: TeamMember[]; invites: TeamInvite[] }) {
  const router = useRouter();
  const uid = useId();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("support");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<{ link: string; emailed: boolean } | null>(null);

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Please try again.");
      if (err instanceof ApiFailure) setFields(err.fields);
    } finally {
      setBusy(null);
    }
  }

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    setFields({});
    run("invite", async () => {
      const r = await api<{ invite: { link: string; emailed: boolean } }>("/api/admin/team", { body: { email, name, role } });
      setShown(r.invite);
      setEmail("");
      setName("");
    });
  };

  const act = (m: TeamMember, body: Record<string, unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    run(`${m.id}:${String(body.action)}`, async () => {
      const r = await api<{ link?: string; emailed?: boolean }>(`/api/admin/team/${encodeURIComponent(m.id)}`, { body });
      if (r.link) setShown({ link: r.link, emailed: Boolean(r.emailed) });
    });
  };

  return (
    <div className="space-y-8">
      {shown && <LinkBox link={shown.link} emailed={shown.emailed} onClose={() => setShown(null)} />}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <div>
        <h2 className="eyebrow mb-3">Team ({members.length})</h2>
        <ul className="space-y-3">
          {members.map((m) => {
            const self = m.id === meId;
            const locked = m.source === "env";
            return (
              <li key={m.id} className="card p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-chalk">
                      {m.name} {self && <span className="text-xs font-normal text-dim">(you)</span>}
                    </p>
                    <p className="break-all text-xs text-ash">{m.email}</p>
                    <p className="mt-1 text-xs text-dim">
                      {locked ? "Hosting-settings login (ADMIN_USER)" : `Last sign-in ${when(m.lastSignInAt)}`} · {m.sessions} signed-in browser{m.sessions === 1 ? "" : "s"}
                      {m.status === "disabled" ? " · " : ""}
                      {m.status === "disabled" && <span className="font-semibold text-danger">Disabled</span>}
                    </p>
                  </div>
                  {locked || self ? (
                    <span className="rounded-[2px] border border-tint/15 px-2 py-1 text-xs text-ash">{ROLE_LABELS[m.role]}</span>
                  ) : (
                    <select
                      aria-label={`Role for ${m.name}`}
                      className="field w-auto py-1 text-xs"
                      value={m.role}
                      disabled={busy !== null || m.status === "disabled"}
                      onChange={(e) => act(m, { action: "role", role: e.target.value }, `Change ${m.name}'s role to ${ROLE_LABELS[e.target.value as AdminRole]}?`)}
                    >
                      {ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  )}
                </div>
                {!locked && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.status === "active" && (
                      <button type="button" className="btn btn-outline btn-sm" disabled={busy !== null} onClick={() => act(m, { action: "reset" })}>
                        Password reset link
                      </button>
                    )}
                    {m.sessions > 0 && (
                      <button type="button" className="btn btn-outline btn-sm" disabled={busy !== null} onClick={() => act(m, { action: "sign_out" }, `Sign ${self ? "yourself" : m.name} out of every browser?`)}>
                        Sign out everywhere
                      </button>
                    )}
                    {!self && m.status === "active" && (
                      <button type="button" className="btn btn-outline btn-sm text-danger" disabled={busy !== null} onClick={() => act(m, { action: "disable" }, `Disable ${m.name}'s login? They are signed out at once.`)}>
                        Disable
                      </button>
                    )}
                    {!self && m.status === "disabled" && (
                      <button type="button" className="btn btn-outline btn-sm" disabled={busy !== null} onClick={() => act(m, { action: "enable" })}>
                        Enable
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {invites.length > 0 && (
        <div>
          <h2 className="eyebrow mb-3">Open links ({invites.length})</h2>
          <ul className="space-y-2">
            {invites.map((i) => (
              <li key={i.id} className="card flex flex-wrap items-center justify-between gap-2 p-3 text-xs text-ash">
                <span className="min-w-0 break-all">
                  <span className="font-semibold text-chalk">{i.kind === "invite" ? "Invite" : "Password reset"}</span> · {i.name} · {i.email} · {ROLE_LABELS[i.role]} · by {i.createdBy} · until {when(i.expiresAt)}
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={busy !== null}
                  onClick={() => run(`rev:${i.id}`, async () => void (await api(`/api/admin/team/invites/${encodeURIComponent(i.id)}`, { method: "DELETE" })))}
                >
                  Cancel link
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={invite} noValidate className="card space-y-3 p-5" aria-label="Invite a team member">
        <h2 className="eyebrow">Invite someone</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={`${uid}-n`}>Name</label>
            <input id={`${uid}-n`} className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-invalid={Boolean(fields.name)} />
            {fields.name && <p className="mt-1 text-xs text-danger">{fields.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor={`${uid}-e`}>Email</label>
            <input id={`${uid}-e`} className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} aria-invalid={Boolean(fields.email)} />
            {fields.email && <p className="mt-1 text-xs text-danger">{fields.email}</p>}
          </div>
        </div>
        <fieldset className="space-y-2">
          <legend className="label">Role</legend>
          {ADMIN_ROLES.map((r) => (
            <label key={r} className={`flex cursor-pointer items-start gap-3 rounded-sm border p-3 text-xs ${role === r ? "border-accent" : "border-tint/15"}`}>
              <input type="radio" name={`${uid}-role`} checked={role === r} onChange={() => setRole(r)} className="mt-0.5 accent-[var(--accent)]" />
              <span>
                <span className="font-semibold text-chalk">{ROLE_LABELS[r]}</span>
                <span className="block text-ash">{ROLE_TEXT[r]}</span>
              </span>
            </label>
          ))}
        </fieldset>
        <button type="submit" className="btn btn-primary" disabled={busy !== null || !email || name.trim().length < 2}>
          {busy === "invite" ? "Creating link…" : "Create invite link"}
        </button>
      </form>
    </div>
  );
}
