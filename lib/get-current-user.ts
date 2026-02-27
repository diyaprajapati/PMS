import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/** Returns the current user from NextAuth session, or null if unauthenticated. */
export async function getCurrentUser(_req?: Request): Promise<CurrentUser | null> {
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
