import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/get-current-user";

export type MeUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

// GET /api/auth/me - current user from NextAuth session
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (user) {
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        } satisfies MeUser,
      });
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
