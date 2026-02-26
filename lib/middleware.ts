import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  const { pathname } = req.nextUrl;

  // Protect dashboard when not authenticated
  if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/projects"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Prevent navigating back to auth pages when logged in
  if (token && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/projects", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/register", "/projects", "/projects/:path*", "/tasks", "/tasks/:path*"],
};