import { ApiError, fail } from "@/lib/server/http";
import { requireAdmin } from "@/lib/server/admin-auth";
import { ordersCsv } from "@/lib/server/admin-reports";
import { audit } from "@/lib/server/vendors";

export const dynamic = "force-dynamic";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const cell = (v: string) => (/[",\n\r]/.test(v) || /^[=+\-@]/.test(v) ? `"${(/^[=+\-@]/.test(v) ? "'" : "") + v.replace(/"/g, '""')}"` : v);

/** GET ?from=YYYY-MM-DD&to=YYYY-MM-DD → orders placed in that range (India dates) as CSV. */
export async function GET(req: Request) {
  try {
    const me = await requireAdmin("reports");
    const u = new URL(req.url);
    const from = u.searchParams.get("from") ?? "";
    const to = u.searchParams.get("to") ?? "";
    if (!DAY.test(from) || !DAY.test(to) || from > to) throw new ApiError(400, "invalid", "Choose a valid date range.");
    const rows = await ordersCsv({ from, to });
    await audit({ type: "admin", id: me.email }, "report.orders_csv", { detail: { from, to, rows: rows.length - 1 } });
    const body = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
    return new Response(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="riderzpro-orders-${from}-to-${to}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return fail(err);
  }
}
