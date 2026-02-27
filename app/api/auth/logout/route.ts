import { NextResponse } from "next/server";

// POST /api/auth/logout
export async function POST() {
    return NextResponse.json(
        { message: "Use NextAuth signOut on client." },
        { status: 200 },
    );
}
