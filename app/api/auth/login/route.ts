import { NextResponse } from "next/server";

// Deprecated: use NextAuth Credentials sign-in from `/api/auth/callback/credentials`.
export async function POST() {
    return NextResponse.json(
        { error: "Use NextAuth credentials sign-in flow." },
        { status: 410 },
    );
}
