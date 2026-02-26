import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { TaskStatus } from "@/lib/generated/prisma/client";
import { TaskPriority } from "@/lib/generated/prisma/enums";
import { createTaskWithRules } from "@/lib/task-service";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/tasks – list tasks with filters
export async function GET(req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;

  const { searchParams } = new URL(req.url);
  const sprintId = searchParams.get("sprintId");
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");
  const priority = searchParams.get("priority");
  const parentTaskId = searchParams.get("parentTaskId");
  const includeSubtasks = searchParams.get("includeSubtasks") === "true";

  try {
    const where: any = {
      projectId,
    };

    // Filter by sprint / backlog
    // If sprintId is provided → tasks in that sprint.
    // If sprintId is omitted → backlog (no sprint).
    if (sprintId) {
      where.sprintId = sprintId;
    } else {
      where.sprintId = null;
    }

    // Filter by status
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status;
    }

    // Filter by assignee
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Filter by priority
    if (
      priority &&
      Object.values(TaskPriority).includes(priority as TaskPriority)
    ) {
      where.priority = priority;
    }

    // Filter by parent task (for subtasks)
    if (parentTaskId === "null") {
      where.parentTaskId = null; // Only top-level tasks
    } else if (parentTaskId) {
      where.parentTaskId = parentTaskId;
    }

    const tasks = await prisma.task.findMany({
      where,
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
        ...(includeSubtasks && {
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
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/tasks – create a new task
export async function POST(req: Request, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;

  let body: {
    title?: string;
    description?: string | null;
    acceptanceCriteria?: string | null;
    estimatedHours?: number | null;
    sprintId?: string | null;
    assigneeId?: string | null;
    parentTaskId?: string | null;
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

  // Validate required fields
  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const task = await createTaskWithRules({
      projectId,
      title,
      description: body.description ?? null,
      acceptanceCriteria: body.acceptanceCriteria ?? null,
      estimatedHours: body.estimatedHours ?? null,
      sprintId: body.sprintId ?? null,
      assigneeId: body.assigneeId ?? null,
      parentTaskId: body.parentTaskId ?? null,
      priority: body.priority ?? null,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create task" },
      { status: 400 }
    );
  }
}
