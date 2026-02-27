import { NextResponse } from "next/server";

// Deprecated: NextAuth session already manages token lifecycle.
export async function POST() {
  return NextResponse.json(
    { error: "Deprecated. NextAuth session token is used automatically." },
    { status: 410 },
  );
}
