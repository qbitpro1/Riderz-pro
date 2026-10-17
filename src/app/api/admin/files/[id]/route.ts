import { fileResponse, loadFile } from "@/lib/server/files";
import { fail } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

/** Any uploaded file, for the KYC and product review queues. Admin only (sellers role). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin("sellers");
    const f = await loadFile((await params).id);
    if (!f) return new Response("Not found", { status: 404 });
    return fileResponse(f, "private");
  } catch (err) {
    return fail(err);
  }
}
