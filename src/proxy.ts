import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: redirects signed-out visitors away from private areas.
// Real authorization happens in the data access layer (src/server/auth, src/server/services).
const PRIVATE_PREFIXES = [
  "/dashboard", "/clients", "/cases", "/hearings", "/deadlines", "/calendar", "/documents",
  "/tasks", "/appointments", "/communications", "/billing", "/reports", "/admin", "/settings",
  "/portal", "/assistant", "/notifications",
];

const COOKIE_NAMES = ["__Host-ld_session", "ld_session"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPrivate) return NextResponse.next();

  const hasSession = COOKIE_NAMES.some((n) => request.cookies.has(n));
  if (!hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)"],
};
