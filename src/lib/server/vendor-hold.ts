import "server-only";

import { z } from "zod";
import { sql, type Query } from "@/lib/db/client";
import { ApiError, rateLimit } from "./http";
import { newId } from "./security";
import { assertOwnFiles } from "./files";
import { audit, notifyVendor } from "./vendors";

/**
 * FROZEN SELLER ACCOUNTS: THE CONVERSATION
 *
 * When an admin freezes (suspends) a seller, their message opens a thread here. The seller's
 * dashboard is locked behind that message until the freeze is lifted; the seller can reply with
 * supporting documents (files of kind doc_hold_reply, private to the seller and admins), and the
 * admin can answer from the seller's review page. Lifting the freeze adds a closing note. The
 * thread is kept, so the next freeze shows the history too.
 */

export type HoldMessage = {
  id: string;
  from: "admin" | "vendor";
  author: string;
  body: string;
  files: { id: string; name: string; mime: string; size: number }[];
  createdAt: string;
};

export const MAX_HOLD_FILES = 5;

export const holdReplySchema = z.object({
  body: z.string().trim().min(2, "Write a message").max(2000, "Keep it under 2,000 characters"),
  fileIds: z.array(z.string().min(1).max(60)).max(MAX_HOLD_FILES, `Attach up to ${MAX_HOLD_FILES} files`).default([]),
});

export const adminHoldSchema = z.object({
  body: z.string().trim().min(2, "Write a message").max(2000, "Keep it under 2,000 characters"),
});

/** The freeze message (and any later admin note), inside the caller's transaction. */
export async function addAdminHoldMessage(vendorId: string, author: string, body: string, q: Query = sql): Promise<void> {
  await q("INSERT INTO vendor_hold_messages (id, vendor_id, sender, author, body) VALUES ($1, $2, 'admin', $3, $4)", [
    newId("vhm"),
    vendorId,
    author,
    body,
  ]);
}

export async function holdMessages(vendorId: string): Promise<HoldMessage[]> {
  const rows = await sql<{ id: string; sender: "admin" | "vendor"; author: string; body: string; file_ids: string[]; created_at: Date }>(
    "SELECT id, sender, author, body, file_ids, created_at FROM vendor_hold_messages WHERE vendor_id = $1 ORDER BY created_at, id",
    [vendorId],
  );
  const ids = rows.flatMap((r) => r.file_ids);
  const files = ids.length
    ? await sql<{ id: string; mime: string; size_bytes: number }>("SELECT id, mime, size_bytes FROM files WHERE id = ANY($1::text[])", [ids])
    : [];
  const byId = new Map(files.map((f) => [f.id, f]));
  return rows.map((r) => ({
    id: r.id,
    from: r.sender,
    // Admin emails stay internal: the seller sees "Riderzpro team".
    author: r.author,
    body: r.body,
    files: r.file_ids.flatMap((id, i) => {
      const f = byId.get(id);
      return f ? [{ id, name: `Document ${i + 1}${f.mime === "application/pdf" ? ".pdf" : ""}`, mime: f.mime, size: f.size_bytes }] : [];
    }),
    createdAt: new Date(r.created_at).toISOString(),
  }));
}

/** What the seller sees: the same thread with admin names hidden. */
export async function holdMessagesForVendor(vendorId: string): Promise<HoldMessage[]> {
  return (await holdMessages(vendorId)).map((m) => (m.from === "admin" ? { ...m, author: "Riderzpro team" } : m));
}

/** A frozen seller's reply, with documents they uploaded as doc_hold_reply. */
export async function addVendorHoldReply(
  vendor: { id: string; fullName: string; status: string },
  input: z.infer<typeof holdReplySchema>,
  ip: string,
): Promise<void> {
  if (vendor.status !== "suspended") throw new ApiError(409, "not_frozen", "Your account isn't frozen, so there is nothing to reply to.");
  await rateLimit(`hold-reply:${vendor.id}`, 20, 24 * 60 * 60);
  const fileIds = [...new Set(input.fileIds)];
  await assertOwnFiles(vendor.id, fileIds, ["doc_hold_reply"]);
  await sql("INSERT INTO vendor_hold_messages (id, vendor_id, sender, author, body, file_ids) VALUES ($1, $2, 'vendor', $3, $4, $5)", [
    newId("vhm"),
    vendor.id,
    vendor.fullName,
    input.body,
    fileIds,
  ]);
  await audit({ type: "vendor", id: vendor.id }, "hold.reply", { vendorId: vendor.id, ip, detail: { files: fileIds.length } });
}

/** An admin's answer while the seller is frozen. */
export async function addAdminHoldReply(vendorId: string, admin: string, body: string, ip: string): Promise<void> {
  const rows = await sql<{ status: string }>("SELECT status FROM vendors WHERE id = $1", [vendorId]);
  if (!rows[0]) throw new ApiError(404, "not_found", "Seller not found.");
  if (rows[0].status !== "suspended") throw new ApiError(409, "not_frozen", "This seller isn't frozen. Freeze the account to message them here.");
  await addAdminHoldMessage(vendorId, admin, body);
  await audit({ type: "admin", id: admin }, "hold.admin_reply", { vendorId, ip });
  await notifyVendor(vendorId, { type: "account", title: "New message about your frozen account", body: body.slice(0, 300), link: "/vendor/dashboard" });
}
