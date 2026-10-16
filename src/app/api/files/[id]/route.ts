import { currentVendor } from "@/lib/server/session";
import { fileResponse, isDocument, loadFile } from "@/lib/server/files";
import { fail } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * Public file download. Logos, banners and product photos of approved
 * vendors are public; anything else is visible only to the vendor who
 * uploaded it. Documents are never public — admins read them through
 * /api/admin/files/[id].
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const f = await loadFile((await params).id);
    if (!f) return new Response("Not found", { status: 404 });
    if (!isDocument(f.kind) && f.vendor_status === "approved") return fileResponse(f, "public");
    const me = await currentVendor();
    if (me && me.id === f.vendor_id) return fileResponse(f, "private");
    return new Response("Not found", { status: 404 });
  } catch (err) {
    return fail(err);
  }
}
