import { prisma } from "@/lib/prisma";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/** Returns the current user from JWT cookie, Authorization header, or NextAuth session, or null if unauthenticated. */
export async function getCurrentUser(req?: Request): Promise<CurrentUser | null> {
  let token: string | undefined;

  // Try to get token from Authorization header first (for API testing)
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  } else {
    // Try to get from headers() if available (Next.js App Router)
    try {
      const headersList = await headers();
      const authHeader = headersList.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    } catch {
      // headers() not available in this context
    }
  }

  // If no token from header, try cookies
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("token")?.value;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
        email: string;
      };
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, image: true },
      });
      if (user) return user as CurrentUser;
    } catch (error) {
      // JWT invalid or expired - log for debugging
      console.log("JWT verification failed:", error instanceof Error ? error.message : "Unknown error");
    }
  }

  const session = await getServerSession(authOptions);
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, image: true },
    });
    if (user) return user as CurrentUser;
  }

  return null;
}
