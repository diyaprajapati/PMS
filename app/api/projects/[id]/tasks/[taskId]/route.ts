import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { canModifyTask, canDeleteTask } from "@/lib/task-permissions";
import { TaskStatus } from "@prisma/client";
import { TaskPriority } from "@prisma/client";
import { updateTaskWithRules } from "@/lib/task-service";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

// GET /api/projects/[id]/tasks/[taskId] – get a single task
export async function GET(req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;
  const routeParams = await context.params;
  const taskId = routeParams.taskId;

  if (!taskId) {
    return NextResponse.json(
      { error: "Task ID is required" },
      { status: 400 }
    );
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
        projectId, // Ensure task belongs to project
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
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        subtasks: {
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
            _count: {
              select: {
                subtasks: true,
              },
            },
          },
        },
        _count: {
          select: {
            subtasks: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id]/tasks/[taskId] – update a task
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

  // Check if user can modify this task
  const canModify = await canModifyTask(user.id, taskId);
  if (!canModify) {
    return NextResponse.json(
      { error: "You don't have permission to modify this task" },
      { status: 403 }
    );
  }

  let body: {
    title?: string;
    description?: string | null;
    acceptanceCriteria?: string | null;
    status?: string;
    estimatedHours?: number | null;
    sprintId?: string | null;
    priority?: TaskPriority | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  let statusEnum: TaskStatus | undefined;
  if (body.status) {
    const s = body.status.toUpperCase();
    if (!Object.values(TaskStatus).includes(s as TaskStatus)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be one of: TODO, IN_PROGRESS, DONE",
        },
        { status: 400 }
      );
    }
    statusEnum = s as TaskStatus;
  }

  try {
    const updatedTask = await updateTaskWithRules({
      projectId,
      taskId,
      title: body.title,
      description: body.description,
      acceptanceCriteria: body.acceptanceCriteria,
      status: statusEnum,
      estimatedHours: body.estimatedHours,
      sprintId: body.sprintId,
      priority: body.priority ?? undefined,
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("Error updating task:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error?.message ?? "Failed to update task" },
      { status: 400 }
    );
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] – delete a task
export async function DELETE(req: Request, context: RouteContext) {
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

  // Check if user can delete tasks (admin/owner/developer)
  const canDelete = await canDeleteTask(user.id, projectId);
  if (!canDelete) {
    return NextResponse.json(
      { error: "You don't have permission to delete tasks" },
      { status: 403 }
    );
  }

  try {
    await prisma.task.delete({
      where: {
        id: taskId,
        projectId, // Ensure task belongs to project
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
