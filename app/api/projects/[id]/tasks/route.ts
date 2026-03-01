import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { TaskStatus } from "@prisma/client";
import { TaskPriority } from "@prisma/client";
import { createTaskWithRules } from "@/lib/task-service";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/tasks – list tasks with filters
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await requireProjectAccess(context.params);
  if (!auth.success) return auth.response;
  const { projectId } = auth;

  const searchParams = req.nextUrl.searchParams;
  // Use a sentinel so we can distinguish "not provided" from "explicitly null/backlog"
  const sprintIdParam = searchParams.get("sprintId"); // null means param absent
  const status = searchParams.get("status");
  const assigneeId = searchParams.get("assigneeId");
  const priority = searchParams.get("priority");
  const parentTaskId = searchParams.get("parentTaskId");
  const includeSubtasks = searchParams.get("includeSubtasks") === "true";
  // Explicit backlog flag: pass sprintId=backlog or sprintId=null (string)
  const isBacklogView = sprintIdParam === "backlog" || sprintIdParam === "null";

  try {
    const where: any = {
      projectId,
    };

    // Sprint filtering:
    // - sprintId=<uuid>  → tasks in that sprint
    // - sprintId=backlog or sprintId=null (string) → tasks with no sprint (backlog)
    // - param absent (sprintIdParam === null) → no sprint filter (all tasks)
    if (sprintIdParam !== null) {
      if (isBacklogView) {
        where.sprintId = null;
      } else {
        where.sprintId = sprintIdParam;
      }
    }
    // else: no sprintId filter applied — return tasks across all sprints

    // Filter by status
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status;
    }

    // Filter by assignee: resolve to ProjectMember id (support both member id and user id so name/email display both work)
    if (assigneeId) {
      const memberById = await prisma.projectMember.findFirst({
        where: { id: assigneeId, projectId },
        select: { id: true },
      });
      let resolvedAssigneeId: string | null = memberById?.id ?? null;
      if (!resolvedAssigneeId) {
        const memberByUserId = await prisma.projectMember.findFirst({
          where: { userId: assigneeId, projectId },
          select: { id: true },
        });
        resolvedAssigneeId = memberByUserId?.id ?? null;
      }
      if (resolvedAssigneeId) {
        where.assigneeId = resolvedAssigneeId;
      }
    }

    // Filter by priority
    if (
      priority &&
      Object.values(TaskPriority).includes(priority as TaskPriority)
    ) {
      where.priority = priority;
    }

    // Filter by parent task (for subtasks).
    // When filtering by assignee or status, include tasks at any level (so assigned subtasks show up).
    const filterByAssigneeOrStatus = !!(assigneeId || (status && Object.values(TaskStatus).includes(status as TaskStatus)));
    if (!filterByAssigneeOrStatus) {
      if (parentTaskId === "null") {
        where.parentTaskId = null; // Only top-level tasks
      } else if (parentTaskId) {
        where.parentTaskId = parentTaskId;
      }
    }

    const taskInclude = {
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
      ...(includeSubtasks && !filterByAssigneeOrStatus && {
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
    };

    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    // When we returned a flat list (assignee/status filter), build a tree so the frontend gets the same shape (roots with nested subtasks).
    let result = tasks;
    if (filterByAssigneeOrStatus && tasks.length > 0) {
      const byId = new Map(tasks.map((t) => [t.id, { ...t, subtasks: [] as typeof tasks }]));
      const roots: typeof tasks = [];
      for (const t of tasks) {
        const node = byId.get(t.id)!;
        if (!t.parentTaskId) {
          roots.push(node);
        } else {
          const parent = byId.get(t.parentTaskId);
          if (parent && "subtasks" in parent) {
            (parent as { subtasks: typeof tasks }).subtasks.push(node);
          } else {
            roots.push(node);
          }
        }
      }
      result = roots;
    }

    return NextResponse.json(result);
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
  const { projectId, user } = auth;

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
      creatorUserId: user.id,
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