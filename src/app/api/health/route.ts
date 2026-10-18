import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sqlOne } from "@/lib/db/client";
import { checkConfig } from "@/lib/server/config-check";

export const dynamic = "force-dynamic";

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * GET /api/health → 200 { ok: true } when the database answers, 503 otherwise (for the host's
 * uptime check). With `Authorization: Bearer <CRON_SECRET>` it also lists the latest migration,
 * which features are on and any settings warnings (names only, never values).
 */
export async function GET(req: Request) {
  let db = false;
  let migration: string | null = null;
  try {
    const r = await sqlOne<{ id: string }>("SELECT id FROM schema_migrations ORDER BY id DESC LIMIT 1");
    db = true;
    migration = r?.id ?? null;
  } catch {
    db = false;
  }
  const secret = process.env.CRON_SECRET?.trim();
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const detail = secret && given && same(given, secret) ? { migration, ...checkConfig() } : {};
  return NextResponse.json({ ok: db, db, ...detail }, { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
