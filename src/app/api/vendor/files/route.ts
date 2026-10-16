import { ApiError, guardMutation, ok, rateLimit, route } from "@/lib/server/http";
import { CAN_EDIT_ONBOARDING, CAN_SELL, requireVendor } from "@/lib/server/session";
import { FILE_KINDS, isDocument, saveFile, type FileKind } from "@/lib/server/files";
import { fileHref } from "@/lib/vendor/types";

export const dynamic = "force-dynamic";

/**
 * POST multipart/form-data { kind, file } → { ok, file: { id, url, mime, size } }
 *
 * Documents, logo and banner: while onboarding is editable (draft, changes requested)
 * or, for logo/banner, once approved (store settings). Product photos: approved vendors only.
 */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > 6 * 1024 * 1024) throw new ApiError(413, "file_too_large", "Files must be under 5 MB.");

  const vendor = await requireVendor();
  await rateLimit(`upload:${vendor.id}`, 120, 60 * 60);

  const form = await req.formData();
  const kind = String(form.get("kind") ?? "") as FileKind;
  const file = form.get("file");
  if (!FILE_KINDS.includes(kind)) throw new ApiError(400, "bad_kind", "Unknown file type.");
  if (!(file instanceof File)) throw new ApiError(400, "no_file", "Choose a file to upload.");

  const allowed =
    kind === "product_image"
      ? CAN_SELL.includes(vendor.status)
      : isDocument(kind)
        ? CAN_EDIT_ONBOARDING.includes(vendor.status)
        : CAN_EDIT_ONBOARDING.includes(vendor.status) || CAN_SELL.includes(vendor.status);
  if (!allowed) throw new ApiError(403, "not_allowed", "You can't upload this file right now.");

  const saved = await saveFile(vendor.id, kind, file);
  return ok({ file: { ...saved, url: fileHref(saved.id) } }, 201);
});
