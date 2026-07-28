import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const isDevTalkHost = host.startsWith("devtalk.provincias.ch");

  if (isDevTalkHost) {
    const { pathname } = request.nextUrl;
    if (pathname.startsWith("/admin") || pathname.startsWith("/devtalk")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/devtalk" : `/devtalk${pathname}`;
    return NextResponse.rewrite(url);
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/devtalk/admin" || pathname.startsWith("/devtalk/admin/")) {
    const rest = pathname.slice("/devtalk/admin".length) || "";
    return NextResponse.redirect(new URL(`/admin${rest}`, request.url));
  }
  if (
    pathname.startsWith("/admin/") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/admin/logout") &&
    !pathname.startsWith("/admin/api/")
  ) {
    const authed = request.cookies.get(ADMIN_COOKIE_NAME)?.value === "1";
    if (!authed) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};

