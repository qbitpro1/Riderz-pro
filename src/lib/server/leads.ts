import "server-only";

import { z } from "zod";
import { sql } from "@/lib/db/client";
import { LEAD_KINDS, type LeadKind } from "@/lib/leads/types";
import { ApiError } from "./http";
import { newId } from "./security";
import { audit } from "./vendors";

/**
 * REQUESTS FROM THE SITE'S WHATSAPP FORMS (leads)
 *
 * Garage bookings, used-car inspections, partner sign-ups, the BE 6 waitlist, selling a car and
 * the quote builders all open WhatsApp with a ready message. Each is saved here first (the browser
 * calls POST /api/leads), so nothing is lost if the shopper never presses send. The team works
 * them in /admin/leads: new → contacted → closed.
 */

const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

export const leadSchema = z.object({
  kind: z.enum(Object.keys(LEAD_KINDS) as [LeadKind, ...LeadKind[]]),
  name: opt(100),
  phone: opt(20),
  email: opt(254),
  city: opt(80),
  details: z.record(z.string().max(60), z.string().max(500)).refine((d) => Object.keys(d).length <= 40, "Too many details").default({}),
  message: z.string().trim().min(1).max(4000),
  page: opt(200),
});

export async function saveLead(input: z.infer<typeof leadSchema>, customerId: string | null): Promise<{ id: string }> {
  const id = newId("led");
  await sql(
    `INSERT INTO leads (id, kind, name, phone, email, city, details, message, page, customer_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10)`,
    [id, input.kind, input.name, input.phone, input.email, input.city, JSON.stringify(input.details), input.message, input.page, customerId],
  );
  return { id };
}

export type AdminLead = {
  id: string;
  kind: LeadKind;
  kindLabel: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  details: Record<string, string>;
  message: string;
  page: string | null;
  signedIn: boolean;
  status: "new" | "contacted" | "closed";
  note: string | null;
  handledBy: string | null;
  createdAt: string;
};

export async function listLeadsAdmin(opts: { status?: string; kind?: string }): Promise<{ items: AdminLead[]; counts: Record<string, number> }> {
  const status = ["new", "contacted", "closed"].includes(opts.status ?? "") ? opts.status! : null;
  const kind = opts.kind && opts.kind in LEAD_KINDS ? opts.kind : null;
  const [rows, counts] = await Promise.all([
    sql<{ id: string; kind: LeadKind; name: string | null; phone: string | null; email: string | null; city: string | null; details: Record<string, string>; message: string; page: string | null; customer_id: string | null; status: AdminLead["status"]; note: string | null; handled_by: string | null; created_at: Date }>(
      `SELECT * FROM leads WHERE ($1::text IS NULL OR status = $1) AND ($2::text IS NULL OR kind = $2) ORDER BY created_at DESC LIMIT 200`,
      [status, kind],
    ),
    sql<{ status: string; n: number }>("SELECT status, count(*)::int AS n FROM leads GROUP BY 1"),
  ]);
  return {
    items: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      kindLabel: LEAD_KINDS[r.kind] ?? r.kind,
      name: r.name,
      phone: r.phone,
      email: r.email,
      city: r.city,
      details: r.details,
      message: r.message,
      page: r.page,
      signedIn: r.customer_id !== null,
      status: r.status,
      note: r.note,
      handledBy: r.handled_by,
      createdAt: new Date(r.created_at).toISOString(),
    })),
    counts: Object.fromEntries(counts.map((c) => [c.status, c.n])),
  };
}

export const leadUpdateSchema = z.object({ status: z.enum(["new", "contacted", "closed"]), note: z.string().trim().max(500).optional() });

export async function updateLead(id: string, input: z.infer<typeof leadUpdateSchema>, actor: string, ip: string): Promise<void> {
  const rows = await sql<{ id: string }>(
    "UPDATE leads SET status = $2, note = COALESCE($3, note), handled_by = $4, updated_at = now() WHERE id = $1 RETURNING id",
    [id, input.status, input.note ?? null, actor],
  );
  if (!rows[0]) throw new ApiError(404, "not_found", "Request not found.");
  await audit({ type: "admin", id: actor }, `lead.${input.status}`, { ip, detail: { leadId: id } });
}
