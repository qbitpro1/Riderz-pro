import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * HTTP Basic auth for /admin/*. Credentials come from ADMIN_USER and
 * ADMIN_PASSWORD. When they are not set: production answers 404 (the admin
 * area does not exist), development lets everything through.
 * (In this Next.js version `proxy` replaces `middleware`.)
 */

/** Length-independent, constant-time string comparison. */
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  const len = Math.max(ea.length, eb.length);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < len; i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

function decodeBasic(header: string | null): { user: string; pass: string } | null {
  if (!header || !header.toLowerCase().startsWith("basic ")) return null;
  try {
    const bytes = Uint8Array.from(atob(header.slice(6).trim()), (c) => c.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    const i = text.indexOf(":");
    if (i === -1) return null;
    return { user: text.slice(0, i), pass: text.slice(i + 1) };
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!user || !password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Not found", { status: 404 });
    }
    return NextResponse.next();
  }

  const given = decodeBasic(request.headers.get("authorization"));
  // Evaluate both comparisons regardless of the first result.
  const okUser = safeEqual(given?.user ?? "", user);
  const okPass = safeEqual(given?.pass ?? "", password);
  if (given && okUser && okPass) return NextResponse.next();

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Riderzpro admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
