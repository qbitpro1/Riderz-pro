import { fileResponse, loadFile } from "@/lib/server/files";
import { fail } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/** Any uploaded file, for the KYC and product review queues. Behind admin Basic auth (src/proxy.ts). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const f = await loadFile((await params).id);
    if (!f) return new Response("Not found", { status: 404 });
    return fileResponse(f, "private");
  } catch (err) {
    return fail(err);
  }
}
