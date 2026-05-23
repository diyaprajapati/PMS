import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BugStatus, TaskPriority } from "@prisma/client";
import { requireProjectAccess } from "@/lib/route-auth";
import { getBugById, updateBug } from "@/lib/bug-service";
import { getPostHogClient } from "@/lib/posthog-server";

type RouteContext = { params: Promise<{ id: string; bugId: string }> };

// GET /api/projects/[id]/bugs/[bugId] - get single bug with comments
export async function GET(_req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;
  const routeParams = await context.params;

  if (!routeParams.bugId) {
    return NextResponse.json({ error: "Bug ID is required" }, { status: 400 });
  }

  try {
    const bug = await getBugById(projectId, routeParams.bugId);
    if (!bug) {
      return NextResponse.json({ error: "Bug not found" }, { status: 404 });
    }

    return NextResponse.json(bug);
  } catch (error) {
    console.error("Error fetching bug:", error);
    return NextResponse.json({ error: "Failed to fetch bug" }, { status: 500 });
  }
}

// PATCH /api/projects/[id]/bugs/[bugId] - update bug fields
export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId, user } = auth;
  const routeParams = await context.params;

  if (!routeParams.bugId) {
    return NextResponse.json({ error: "Bug ID is required" }, { status: 400 });
  }

  let body: {
    title?: string;
    description?: string | null;
    assigneeId?: string | null;
    priority?: string;
    status?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let priority: TaskPriority | undefined;
  if (body.priority !== undefined) {
    if (!Object.values(TaskPriority).includes(body.priority as TaskPriority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    priority = body.priority as TaskPriority;
  }

  let status: BugStatus | undefined;
  if (body.status !== undefined) {
    if (!Object.values(BugStatus).includes(body.status as BugStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    status = body.status as BugStatus;
  }

  try {
    const bug = await updateBug({
      projectId,
      bugId: routeParams.bugId,
      title: body.title,
      description: body.description,
      assigneeId: body.assigneeId,
      priority,
      status,
    });

    if (status) {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: user.id,
        event: "bug_status_updated",
        properties: {
          project_id: projectId,
          bug_id: routeParams.bugId,
          new_status: status,
        },
      });
    }

    return NextResponse.json(bug);
  } catch (error: any) {
    console.error("Error updating bug:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update bug" },
      { status: 400 }
    );
  }
}

// DELETE /api/projects/[id]/bugs/[bugId] - delete bug
export async function DELETE(_req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;
  const routeParams = await context.params;

  if (!routeParams.bugId) {
    return NextResponse.json({ error: "Bug ID is required" }, { status: 400 });
  }

  try {
    await prisma.bug.delete({
      where: {
        id: routeParams.bugId,
        projectId,
      },
    });

    return NextResponse.json({ message: "Bug deleted" });
  } catch (error: any) {
    console.error("Error deleting bug:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete bug" },
      { status: 400 }
    );
  }
}
