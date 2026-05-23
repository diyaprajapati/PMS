import { NextResponse } from "next/server";
import { requireProjectAccess } from "@/lib/route-auth";
import {
  createWikiPage,
  getWikiPages,
  getWikiPageById,
  updateWikiPage,
  deleteWikiPage,
} from "@/lib/wiki-service";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/wiki - list wiki pages for a project
export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;

  try {
    const pages = await getWikiPages(projectId);
    return NextResponse.json(pages);
  } catch (error) {
    console.error("Error fetching wiki pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch wiki pages" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/wiki - create a new wiki page
export async function POST(req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId, user } = auth;

  let body: {
    title?: string;
    content?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  try {
    const page = await createWikiPage({
      projectId,
      title,
      content: body.content ?? "",
      authorId: user.id,
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error: any) {
    console.error("Error creating wiki page:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create wiki page" },
      { status: 400 }
    );
  }
}
