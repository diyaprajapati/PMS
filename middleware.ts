import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const sessionToken = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = req.nextUrl;

  if (!sessionToken && (pathname.startsWith("/dashboard") || pathname.startsWith("/projects") || pathname.startsWith("/bugs"))) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (sessionToken && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/projects", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/login",
    "/register",
    "/projects",
    "/projects/:path*",
    "/bugs",
    "/bugs/:path*",
    "/tasks",
    "/tasks/:path*",
  ],
};
