import { currentVendor } from "@/lib/server/session";
import { fileResponse, isDocument, loadFile } from "@/lib/server/files";
import { fail } from "@/lib/server/http";

import { sqlOne } from "@/lib/db/client";

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
    // The team's car and build photos: public once the car (live or sold) or the build is live.
    if (f.kind === "car_photo" || f.kind === "build_photo") {
      const live = await sqlOne(
        f.kind === "car_photo"
          ? "SELECT 1 AS ok FROM car_listings WHERE $1 = ANY(photos) AND status IN ('live','sold') LIMIT 1"
          : "SELECT 1 AS ok FROM builds WHERE $1 = ANY(photos) AND status = 'live' LIMIT 1",
        [f.id],
      );
      return live ? fileResponse(f, "public") : new Response("Not found", { status: 404 });
    }
    const me = await currentVendor();
    if (me && me.id === f.vendor_id) return fileResponse(f, "private");
    return new Response("Not found", { status: 404 });
  } catch (err) {
    return fail(err);
  }
}
