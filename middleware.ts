import { NextResponse, type NextRequest } from "next/server";

import { AUTH_COOKIE_NAME, clearAuthCookie, verifyAuthToken } from "@/lib/auth";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.has(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isApiRoute = pathname.startsWith("/api");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isApiRoute) {
    return NextResponse.next();
  }

  if (!token) {
    if (!isPublicRoute(pathname)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  try {
    const payload = await verifyAuthToken(token);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId);
    requestHeaders.set("x-user-email", payload.email);
    requestHeaders.set("x-user-name", encodeURIComponent(payload.name));

    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));

    clearAuthCookie(response);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
