import { ApiError, guardMutation, ok, rateLimit, route } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { saveAdminPhoto } from "@/lib/server/files";

export const dynamic = "force-dynamic";

/** POST multipart { kind: car_photo | build_photo, file } → { file: { id, url } }. Catalogue role. Public once its car or build is live. */
export const POST = route(async (req: Request) => {
  guardMutation(req);
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > 4 * 1024 * 1024) throw new ApiError(413, "file_too_large", "Photos must be under 3 MB.");
  const me = await requireAdmin("catalog");
  await rateLimit(`admin-upload:${me.email}`, 300, 60 * 60);
  const form = await req.formData();
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");
  if (kind !== "car_photo" && kind !== "build_photo") throw new ApiError(400, "bad_kind", "Unknown photo type.");
  if (!(file instanceof File)) throw new ApiError(400, "no_file", "Choose a photo to upload.");
  const saved = await saveAdminPhoto(kind, file);
  return ok({ file: { ...saved, url: `/api/admin/files/${saved.id}` } }, 201);
});
