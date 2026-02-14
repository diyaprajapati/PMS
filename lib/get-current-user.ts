import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/** Returns the current user from JWT cookie or NextAuth session, or null if unauthenticated. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

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
    } catch {
      // JWT invalid or expired
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
