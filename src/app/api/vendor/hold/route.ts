import { clientIp, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { requireVendor } from "@/lib/server/session";
import { addVendorHoldReply, holdMessagesForVendor, holdReplySchema } from "@/lib/server/vendor-hold";

export const dynamic = "force-dynamic";

/** GET → { frozen, messages } the freeze conversation (kept after the freeze is lifted). */
export const GET = route(async () => {
  const vendor = await requireVendor(["approved", "suspended"]);
  return ok({ frozen: vendor.status === "suspended", messages: await holdMessagesForVendor(vendor.id) });
});

/** POST { body, fileIds } → 201. A frozen seller's reply; fileIds are doc_hold_reply uploads from /api/vendor/files. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const vendor = await requireVendor(["suspended"]);
  const input = await readJson(req, holdReplySchema);
  await addVendorHoldReply(vendor, input, clientIp(req));
  return ok({ messages: await holdMessagesForVendor(vendor.id) }, 201);
});
