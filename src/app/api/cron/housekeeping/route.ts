import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runHousekeeping } from "@/lib/server/housekeeping";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Constant-time comparison of two strings of any length. */
function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * GET /api/cron/housekeeping, called hourly by the host's scheduler with
 * `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends exactly this). Without CRON_SECRET
 * set, the route answers 404 so it can't be triggered by anyone.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return new NextResponse("Not found", { status: 404 });
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!same(given, secret)) return NextResponse.json({ ok: false }, { status: 401 });
  const result = await runHousekeeping();
  return NextResponse.json(result, { status: result.ok ? 200 : 500, headers: { "Cache-Control": "no-store" } });
}
