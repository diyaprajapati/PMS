import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/route-auth";
import { createBugComment } from "@/lib/bug-service";

type RouteContext = { params: Promise<{ id: string; bugId: string }> };

// POST /api/projects/[id]/bugs/[bugId]/comments - create bug comment
export async function POST(req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId, user } = auth;
  const routeParams = await context.params;

  if (!routeParams.bugId) {
    return NextResponse.json({ error: "Bug ID is required" }, { status: 400 });
  }

  let body: { content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
  }

  try {
    const comment = await createBugComment({
      projectId,
      bugId: routeParams.bugId,
      authorId: user.id,
      content: body.content,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bug comment:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create bug comment" },
      { status: 400 }
    );
  }
}
