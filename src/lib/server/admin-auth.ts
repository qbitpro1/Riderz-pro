import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql, sqlOne, transaction } from "@/lib/db/client";
import { ADMIN_ROLES, can, type AdminPerm, type AdminRole, type AdminSelf, type TeamInvite, type TeamMember } from "@/lib/admin/roles";
import { ApiError, rateLimit } from "./http";
import { sendEmail } from "./messaging";
import { siteUrl } from "./order-emails";
import { decoyHash, hashPassword, newId, newToken, sha256, verifyPassword } from "./security";
import { audit } from "./vendors";

/**
 * ADMIN TEAM SIGN-IN AND ROLES
 *
 * Team members sign in at /admin/sign-in with their email and password (scrypt, security.ts). The
 * session is a random token in an HttpOnly cookie, stored hashed, valid 12 hours. What each person
 * may open is decided by their role (src/lib/admin/roles.ts):
 *
 *   pages        `adminPage(perm, here)`: redirect to sign-in, or back to /admin when not allowed
 *   API routes   `requireAdmin(perm)`: 401 / 403 as JSON
 *   proxy.ts     only checks that an admin cookie exists (no database there); the checks above count
 *
 * The owner's first login (and the way back in if every team login is lost) is ADMIN_USER /
 * ADMIN_PASSWORD from the hosting settings, typed into the same form. It signs in as an "owner"
 * row with source 'env' and no stored password. In development with no ADMIN_USER set, a browser
 * without a session is treated as the owner ("dev-admin"), as before.
 *
 * New people join through a one-time invite link (72 hours) that the owner creates on /admin/team;
 * a forgotten password gets a reset link the same way. Links are stored hashed. Every sign-in,
 * invite and change is written to audit_log.
 */

export const ADMIN_COOKIE = "rzp_admin";
const SESSION_HOURS = 12;
const LINK_HOURS = 72;
const ENV_ADMIN_ID = "adm_env_owner";

const env = (k: string) => process.env[k]?.trim() || "";
const envLogin = () => (env("ADMIN_USER") && env("ADMIN_PASSWORD") ? { user: env("ADMIN_USER").toLowerCase(), password: process.env.ADMIN_PASSWORD as string } : null);
const devOwner = (): AdminSelf | null =>
  process.env.NODE_ENV !== "production" && !envLogin() ? { id: "dev-admin", email: "dev-admin", name: "Developer", role: "owner", source: "dev" } : null;

/** Length-independent, constant-time comparison of two strings. */
function sameText(a: string, b: string): boolean {
  const ea = Buffer.from(a);
  const eb = Buffer.from(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

const iso = (d: Date | string | null) => (d ? new Date(d).toISOString() : null);
const actor = (a: AdminSelf) => ({ type: "admin" as const, id: a.email });

/* --------------------------------------------------------------- sessions */

type SessionRow = { id: string; email: string; name: string; role: AdminRole; source: "team" | "env"; last_seen_at: Date };

async function sessionToken(): Promise<string | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return token && token.length <= 100 ? token : null;
}

/** The signed-in team member, or null. */
export async function currentAdmin(): Promise<AdminSelf | null> {
  const token = await sessionToken();
  if (token) {
    const row = await sqlOne<SessionRow>(
      `SELECT u.id, u.email, u.name, u.role, u.source, s.last_seen_at
         FROM admin_sessions s JOIN admin_users u ON u.id = s.admin_id
        WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status = 'active'`,
      [sha256(token)],
    );
    if (row) {
      if (Date.now() - new Date(row.last_seen_at).getTime() > 5 * 60 * 1000) {
        await sql("UPDATE admin_sessions SET last_seen_at = now() WHERE token_hash = $1", [sha256(token)]);
      }
      return { id: row.id, email: row.email, name: row.name, role: row.role, source: row.source };
    }
  }
  return devOwner();
}

/** For admin API routes: the signed-in team member allowed `perm`, or a 401/403. */
export async function requireAdmin(perm: AdminPerm): Promise<AdminSelf> {
  const me = await currentAdmin();
  if (!me) throw new ApiError(401, "signed_out", "Please sign in to the admin area.");
  if (!can(me.role, perm)) throw new ApiError(403, "not_allowed", "Your role doesn't include this. Ask the owner.");
  return me;
}

/** For admin pages: the team member, a redirect to sign-in, or back to the hub when not allowed. */
export async function adminPage(perm: AdminPerm | null, here: string): Promise<AdminSelf> {
  const me = await currentAdmin();
  if (!me) redirect(`/admin/sign-in?next=${encodeURIComponent(here)}`);
  if (perm && !can(me.role, perm)) redirect(`/admin?denied=${encodeURIComponent(perm)}`);
  return me;
}

async function startSession(adminId: string, ip: string): Promise<void> {
  const token = newToken();
  const ua = (await headers()).get("user-agent") ?? "";
  await sql(
    `INSERT INTO admin_sessions (token_hash, admin_id, expires_at, user_agent, ip)
     VALUES ($1, $2, now() + make_interval(hours => $3), $4, $5)`,
    [sha256(token), adminId, SESSION_HOURS, ua.slice(0, 200), ip],
  );
  await sql("UPDATE admin_users SET last_sign_in_at = now() WHERE id = $1", [adminId]);
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function signOutAdmin(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (token) await sql("DELETE FROM admin_sessions WHERE token_hash = $1", [sha256(token)]);
  jar.delete(ADMIN_COOKIE);
}

/* ---------------------------------------------------------------- sign-in */

const WRONG = () => new ApiError(401, "wrong_login", "That email and password don't match an active team login.");

export async function signInAdmin(email: string, password: string, ip: string): Promise<AdminSelf> {
  await rateLimit(`admin-signin:ip:${ip}`, 20, 15 * 60);
  await rateLimit(`admin-signin:email:${sha256(email)}`, 8, 15 * 60);

  // The owner's login from the hosting settings (first login, and the way back in).
  const owner = envLogin();
  if (owner && sameText(email, owner.user)) {
    if (!sameText(password, owner.password)) {
      await audit({ type: "admin", id: email }, "admin.sign_in_failed", { ip });
      throw WRONG();
    }
    const row = await sqlOne<{ id: string; email: string; name: string }>(
      `INSERT INTO admin_users (id, email, name, role, source, created_by)
       VALUES ($1, $2, 'Owner', 'owner', 'env', 'hosting settings')
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = 'owner', status = 'active', updated_at = now()
       RETURNING id, email, name`,
      [ENV_ADMIN_ID, owner.user],
    );
    if (!row) throw WRONG();
    await startSession(row.id, ip);
    await audit({ type: "admin", id: row.email }, "admin.sign_in", { ip, detail: { via: "hosting settings" } });
    return { id: row.id, email: row.email, name: row.name, role: "owner", source: "env" };
  }

  const user = await sqlOne<{ id: string; email: string; name: string; role: AdminRole; password_hash: string | null }>(
    "SELECT id, email, name, role, password_hash FROM admin_users WHERE email = $1 AND status = 'active' AND source = 'team'",
    [email],
  );
  const okPassword = await verifyPassword(password, user?.password_hash ?? (await decoyHash()));
  if (!user || !user.password_hash || !okPassword) {
    await audit({ type: "admin", id: email.slice(0, 254) }, "admin.sign_in_failed", { ip });
    throw WRONG();
  }
  await startSession(user.id, ip);
  await audit({ type: "admin", id: user.email }, "admin.sign_in", { ip });
  return { id: user.id, email: user.email, name: user.name, role: user.role, source: "team" };
}

/* ----------------------------------------------------------- invite links */

/** The live site in production; this local site's own address in development. */
async function linkFor(token: string): Promise<string> {
  const local = process.env.NODE_ENV !== "production" ? (await headers()).get("origin") : null;
  return `${local || siteUrl()}/admin/invite?token=${encodeURIComponent(token)}`;
}

async function mailLink(kind: "invite" | "reset", to: string, name: string, link: string, by: string) {
  const subject = kind === "invite" ? "You're invited to the Riderzpro admin team" : "Set a new Riderzpro admin password";
  const lead =
    kind === "invite"
      ? `${by} invited you to the Riderzpro admin team. Open this link to choose your password (it works once, for ${LINK_HOURS} hours):`
      : `Open this link to set a new password for your Riderzpro admin login (it works once, for ${LINK_HOURS} hours):`;
  const text = `Hi ${name},\n\n${lead}\n${link}\n\nIf you didn't expect this, ignore this email.`;
  const html = `<p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(lead)}</p><p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p><p>If you didn't expect this, ignore this email.</p>`;
  return sendEmail({ to, subject, text, html }).catch(() => ({ status: "failed" as const }));
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

async function createLink(by: AdminSelf, kind: "invite" | "reset", p: { email: string; name: string; role: AdminRole }) {
  const token = newToken();
  const id = newId("ainv");
  await transaction(async (q) => {
    await q("UPDATE admin_invites SET revoked_at = now() WHERE email = $1 AND used_at IS NULL AND revoked_at IS NULL", [p.email]);
    await q(
      `INSERT INTO admin_invites (id, kind, email, name, role, token_hash, created_by, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, now() + make_interval(hours => $8))`,
      [id, kind, p.email, p.name, p.role, sha256(token), by.email, LINK_HOURS],
    );
    await audit(actor(by), `admin.${kind}_created`, { detail: { email: p.email, role: p.role } }, q);
  });
  const link = await linkFor(token);
  const mail = await mailLink(kind, p.email, p.name, link, by.name);
  return { id, link, emailed: mail.status === "sent" };
}

/** Owner only. Returns the one-time link (shown once to copy) and whether it was emailed too. */
export async function inviteMember(by: AdminSelf, p: { email: string; name: string; role: AdminRole }) {
  const envOwner = envLogin();
  if (envOwner && p.email === envOwner.user) throw new ApiError(409, "reserved", "That login is the owner's hosting-settings login.");
  const existing = await sqlOne<{ id: string }>("SELECT id FROM admin_users WHERE email = $1", [p.email]);
  if (existing) throw new ApiError(409, "already_member", "This person is already on the team. Use Reset password instead.", { email: "Already on the team" });
  return createLink(by, "invite", p);
}

export type InviteView = { kind: "invite" | "reset"; email: string; name: string; role: AdminRole };

/** What an invite link is for, or null when it is unknown, used, revoked or expired. */
export async function inviteByToken(token: string): Promise<InviteView | null> {
  if (token.length < 20 || token.length > 100) return null;
  return sqlOne<InviteView>(
    `SELECT kind, email, name, role FROM admin_invites
      WHERE token_hash = $1 AND used_at IS NULL AND revoked_at IS NULL AND expires_at > now()`,
    [sha256(token)],
  );
}

/** Joins the team (invite) or sets a new password (reset), then signs in. */
export async function acceptInvite(p: { token: string; name: string; password: string }, ip: string): Promise<AdminSelf> {
  await rateLimit(`admin-invite:ip:${ip}`, 10, 15 * 60);
  const hash = await hashPassword(p.password);
  const me = await transaction(async (q) => {
    const inv = (
      await q<{ id: string; kind: "invite" | "reset"; email: string; role: AdminRole }>(
        `SELECT id, kind, email, role FROM admin_invites
          WHERE token_hash = $1 AND used_at IS NULL AND revoked_at IS NULL AND expires_at > now() FOR UPDATE`,
        [sha256(p.token)],
      )
    )[0];
    if (!inv) throw new ApiError(410, "link_expired", "This link has expired or was already used. Ask the owner for a new one.");
    await q("UPDATE admin_invites SET used_at = now() WHERE id = $1", [inv.id]);
    let row: { id: string; role: AdminRole } | undefined;
    if (inv.kind === "invite") {
      row = (
        await q<{ id: string; role: AdminRole }>(
          `INSERT INTO admin_users (id, email, name, role, password_hash, created_by)
           VALUES ($1,$2,$3,$4,$5,(SELECT created_by FROM admin_invites WHERE id = $6))
           ON CONFLICT (email) DO NOTHING RETURNING id, role`,
          [newId("adm"), inv.email, p.name, inv.role, hash, inv.id],
        )
      )[0];
      if (!row) throw new ApiError(409, "already_member", "This email is already on the team. Ask the owner for a password reset link.");
    } else {
      row = (
        await q<{ id: string; role: AdminRole }>(
          `UPDATE admin_users SET password_hash = $2, name = $3, updated_at = now()
            WHERE email = $1 AND source = 'team' AND status = 'active' RETURNING id, role`,
          [inv.email, hash, p.name],
        )
      )[0];
      if (!row) throw new ApiError(410, "link_expired", "This login is no longer active. Ask the owner.");
      // A new password ends every other signed-in browser.
      await q("DELETE FROM admin_sessions WHERE admin_id = $1", [row.id]);
    }
    await audit({ type: "admin", id: inv.email }, inv.kind === "invite" ? "admin.joined" : "admin.password_reset", { ip }, q);
    return { id: row.id, email: inv.email, name: p.name, role: row.role, source: "team" as const };
  });
  await startSession(me.id, ip);
  return me;
}

/* ------------------------------------------------------------------ team */

export async function listTeam(): Promise<{ members: TeamMember[]; invites: TeamInvite[] }> {
  const members = await sql<{ id: string; email: string; name: string; role: AdminRole; status: "active" | "disabled"; source: "team" | "env"; created_at: Date; last_sign_in_at: Date | null; sessions: number }>(
    `SELECT u.id, u.email, u.name, u.role, u.status, u.source, u.created_at, u.last_sign_in_at,
            (SELECT count(*)::int FROM admin_sessions s WHERE s.admin_id = u.id AND s.expires_at > now()) AS sessions
       FROM admin_users u ORDER BY (u.source = 'env') DESC, u.status, u.name`,
  );
  const invites = await sql<{ id: string; kind: "invite" | "reset"; email: string; name: string; role: AdminRole; created_by: string; expires_at: Date }>(
    `SELECT id, kind, email, name, role, created_by, expires_at FROM admin_invites
      WHERE used_at IS NULL AND revoked_at IS NULL AND expires_at > now() ORDER BY created_at DESC`,
  );
  return {
    members: members.map((m) => ({ id: m.id, email: m.email, name: m.name, role: m.role, status: m.status, source: m.source, createdAt: iso(m.created_at) as string, lastSignInAt: iso(m.last_sign_in_at), sessions: m.sessions })),
    invites: invites.map((i) => ({ id: i.id, kind: i.kind, email: i.email, name: i.name, role: i.role, createdBy: i.created_by, expiresAt: iso(i.expires_at) as string })),
  };
}

export async function revokeInvite(by: AdminSelf, id: string): Promise<void> {
  const row = await sqlOne<{ email: string }>(
    "UPDATE admin_invites SET revoked_at = now() WHERE id = $1 AND used_at IS NULL AND revoked_at IS NULL RETURNING email",
    [id],
  );
  if (!row) throw new ApiError(404, "not_found", "That link is no longer open.");
  await audit(actor(by), "admin.invite_revoked", { detail: { email: row.email } });
}

type MemberAction = { action: "role"; role: AdminRole } | { action: "disable" } | { action: "enable" } | { action: "reset" } | { action: "sign_out" };

/** Owner only. Returns a reset link for "reset". */
export async function changeMember(by: AdminSelf, id: string, a: MemberAction): Promise<{ link?: string; emailed?: boolean }> {
  if (id === by.id && a.action !== "sign_out" && a.action !== "reset") throw new ApiError(409, "self", "You can't change your own role or access. Ask another owner.");
  const m = await sqlOne<{ id: string; email: string; name: string; role: AdminRole; status: string; source: string }>(
    "SELECT id, email, name, role, status, source FROM admin_users WHERE id = $1",
    [id],
  );
  if (!m) throw new ApiError(404, "not_found", "Team member not found.");
  if (m.source === "env" && a.action !== "sign_out") throw new ApiError(409, "env_owner", "The hosting-settings owner login is changed in the hosting settings.");

  if (a.action === "reset") {
    if (m.status !== "active") throw new ApiError(409, "disabled", "Enable this login first.");
    return createLink(by, "reset", { email: m.email, name: m.name, role: m.role });
  }

  await transaction(async (q) => {
    // Keep at least one active team owner besides the hosting-settings login.
    const losingOwner = m.role === "owner" && m.status === "active" && ((a.action === "role" && a.role !== "owner") || a.action === "disable");
    if (losingOwner) {
      const others = await q<{ n: number }>(
        "SELECT count(*)::int AS n FROM admin_users WHERE role = 'owner' AND status = 'active' AND id <> $1 FOR UPDATE",
        [m.id],
      );
      if ((others[0]?.n ?? 0) === 0) throw new ApiError(409, "last_owner", "There must always be an active owner.");
    }
    if (a.action === "role") {
      if (!ADMIN_ROLES.includes(a.role)) throw new ApiError(400, "invalid", "Unknown role.");
      await q("UPDATE admin_users SET role = $2, updated_at = now() WHERE id = $1", [m.id, a.role]);
    } else if (a.action === "disable") {
      await q("UPDATE admin_users SET status = 'disabled', updated_at = now() WHERE id = $1", [m.id]);
      await q("DELETE FROM admin_sessions WHERE admin_id = $1", [m.id]);
    } else if (a.action === "enable") {
      await q("UPDATE admin_users SET status = 'active', updated_at = now() WHERE id = $1", [m.id]);
    }
    if (a.action === "sign_out") await q("DELETE FROM admin_sessions WHERE admin_id = $1", [m.id]);
    await audit(actor(by), `admin.member_${a.action}`, { detail: { email: m.email, ...(a.action === "role" ? { from: m.role, to: a.role } : {}) } }, q);
  });
  if (a.action === "sign_out" && m.id === by.id) (await cookies()).delete(ADMIN_COOKIE);
  return {};
}

/* -------------------------------------------------------------- audit log */

export type AuditRow = { id: number; at: string; actorType: string; actor: string; action: string; vendorId: string | null; detail: Record<string, unknown> | null; ip: string | null };

export async function listAudit(f: { q?: string; actorType?: string; before?: number }): Promise<{ rows: AuditRow[]; next: number | null }> {
  const LIMIT = 100;
  const q = f.q?.trim().slice(0, 80) || null;
  const type = f.actorType && ["vendor", "admin", "system", "customer"].includes(f.actorType) ? f.actorType : null;
  const rows = await sql<{ id: string; at: Date; actor_type: string; actor: string; action: string; vendor_id: string | null; detail: Record<string, unknown> | null; ip: string | null }>(
    `SELECT id, at, actor_type, actor, action, vendor_id, detail, ip FROM audit_log
      WHERE ($1::text IS NULL OR action ILIKE '%' || $1 || '%' OR actor ILIKE '%' || $1 || '%' OR detail::text ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR actor_type = $2)
        AND ($3::bigint IS NULL OR id < $3)
      ORDER BY id DESC LIMIT ${LIMIT + 1}`,
    [q, type, f.before ?? null],
  );
  const page = rows.slice(0, LIMIT).map((r) => ({ id: Number(r.id), at: iso(r.at) as string, actorType: r.actor_type, actor: r.actor, action: r.action, vendorId: r.vendor_id, detail: r.detail, ip: r.ip }));
  return { rows: page, next: rows.length > LIMIT ? page[page.length - 1].id : null };
}
