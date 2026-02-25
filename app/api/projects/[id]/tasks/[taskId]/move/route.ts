import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { canModifyTask } from "@/lib/task-permissions";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

// PATCH /api/projects/[id]/tasks/[taskId]/move – move task to sprint or backlog
export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId, user } = auth;
  const routeParams = await context.params;
  const taskId = routeParams.taskId;

  if (!taskId) {
    return NextResponse.json(
      { error: "Task ID is required" },
      { status: 400 }
    );
  }

  // Check if user can modify this task (assignee or admin/owner)
  const canModify = await canModifyTask(user.id, taskId);
  if (!canModify) {
    return NextResponse.json(
      { error: "You don't have permission to move this task" },
      { status: 403 }
    );
  }

  let body: {
    sprintId?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (body.sprintId === undefined) {
    return NextResponse.json(
      { error: "sprintId is required (use null for backlog)" },
      { status: 400 }
    );
  }

  // Validate sprint exists and belongs to project
  if (body.sprintId) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: body.sprintId },
      select: { projectId: true },
    });

    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    if (sprint.projectId !== projectId) {
      return NextResponse.json(
        { error: "Sprint does not belong to this project" },
        { status: 400 }
      );
    }
  }

  try {
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
        projectId, // Ensure task belongs to project
      },
      data: {
        sprintId: body.sprintId,
      },
      include: {
        assignee: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        sprint: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
          },
        },
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("Error moving task:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to move task" },
      { status: 500 }
    );
  }
}
