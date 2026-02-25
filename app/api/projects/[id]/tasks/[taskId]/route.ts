import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { canModifyTask, canDeleteTask } from "@/lib/task-permissions";
import { TaskStatus } from "@/lib/generated/prisma/client";

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
    assigneeId?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const data: any = {};

  // Validate and add title
  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }
    data.title = title;
  }

  // Add description
  if (body.description !== undefined) {
    data.description = body.description;
  }

  // Add acceptance criteria
  if (body.acceptanceCriteria !== undefined) {
    data.acceptanceCriteria = body.acceptanceCriteria;
  }

  // Validate and add status
  if (body.status) {
    const status = body.status.toUpperCase();
    if (!Object.values(TaskStatus).includes(status as TaskStatus)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be one of: TODO, IN_PROGRESS, DONE",
        },
        { status: 400 }
      );
    }
    data.status = status;
  }

  // Validate and add estimated hours
  if (body.estimatedHours !== undefined) {
    if (body.estimatedHours !== null && body.estimatedHours < 0) {
      return NextResponse.json(
        { error: "Estimated hours must be a positive number" },
        { status: 400 }
      );
    }
    data.estimatedHours = body.estimatedHours;
  }

  // Validate and add sprint
  if (body.sprintId !== undefined) {
    if (body.sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: body.sprintId },
        select: { projectId: true },
      });

      if (!sprint) {
        return NextResponse.json(
          { error: "Sprint not found" },
          { status: 404 }
        );
      }

      if (sprint.projectId !== projectId) {
        return NextResponse.json(
          { error: "Sprint does not belong to this project" },
          { status: 400 }
        );
      }
    }
    data.sprintId = body.sprintId;
  }

  // Validate and add assignee
  if (body.assigneeId !== undefined) {
    if (body.assigneeId) {
      const member = await prisma.projectMember.findUnique({
        where: { id: body.assigneeId },
        select: { projectId: true },
      });

      if (!member) {
        return NextResponse.json(
          { error: "Assignee not found" },
          { status: 404 }
        );
      }

      if (member.projectId !== projectId) {
        return NextResponse.json(
          { error: "Assignee is not a member of this project" },
          { status: 400 }
        );
      }
    }
    data.assigneeId = body.assigneeId;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  try {
    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
        projectId, // Ensure task belongs to project
      },
      data,
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
    console.error("Error updating task:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
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

  // Check if user can delete tasks (admin/owner only)
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
