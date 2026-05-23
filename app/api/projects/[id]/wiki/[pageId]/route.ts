import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/route-auth";
import {
  getWikiPageById,
  updateWikiPage,
  deleteWikiPage,
} from "@/lib/wiki-service";

type RouteContext = { params: Promise<{ id: string; pageId: string }> };

// GET /api/projects/[id]/wiki/[pageId] - get a single wiki page
export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;
  const { pageId } = await context.params;

  try {
    const page = await getWikiPageById(projectId, pageId);
    if (!page) {
      return NextResponse.json(
        { error: "Wiki page not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(page);
  } catch (error) {
    console.error("Error fetching wiki page:", error);
    return NextResponse.json(
      { error: "Failed to fetch wiki page" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/wiki/[pageId] - update a wiki page
export async function PUT(req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;
  const { pageId } = await context.params;

  let body: {
    title?: string;
    content?: object;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  try {
    const page = await updateWikiPage({
      projectId,
      pageId,
      title: body.title,
      content: body.content,
    });

    return NextResponse.json(page);
  } catch (error: any) {
    console.error("Error updating wiki page:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update wiki page" },
      { status: 400 }
    );
  }
}

// DELETE /api/projects/[id]/wiki/[pageId] - delete a wiki page
export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;
  const { pageId } = await context.params;

  try {
    await deleteWikiPage(projectId, pageId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting wiki page:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete wiki page" },
      { status: 400 }
    );
  }
}
