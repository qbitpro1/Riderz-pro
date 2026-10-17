import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * First gate for /admin/* and /api/admin/*: without an admin session cookie, pages go to
 * /admin/sign-in and API routes answer 401. It does not open the database, so it only checks that
 * the cookie is there; every admin page and route then checks the session and the person's role
 * itself (adminPage / requireAdmin in src/lib/server/admin-auth.ts), which is what counts.
 *
 * Open without a session: the sign-in page, invite / reset links, and their API routes.
 * In development with no ADMIN_USER set, everything is let through (the browser is the owner).
 * (In this Next.js version `proxy` replaces `middleware`.)
 */
const ADMIN_COOKIE = "rzp_admin";
const OPEN = [/^\/admin\/sign-in\/?$/, /^\/admin\/invite\/?$/, /^\/api\/admin\/auth(\/|$)/];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (OPEN.some((re) => re.test(pathname))) return NextResponse.next();

  const devOpen = process.env.NODE_ENV !== "production" && !process.env.ADMIN_USER?.trim();
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (devOpen || (token && token.length <= 100)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "signed_out", message: "Please sign in to the admin area." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  const url = request.nextUrl.clone();
  url.pathname = "/admin/sign-in";
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
