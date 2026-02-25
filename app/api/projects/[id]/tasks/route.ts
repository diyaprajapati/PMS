import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { TaskStatus } from "@/lib/generated/prisma/client";

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
  const parentTaskId = searchParams.get("parentTaskId");
  const includeSubtasks = searchParams.get("includeSubtasks") === "true";

  try {
    const where: any = {
      projectId,
    };

    // Filter by sprint
    if (sprintId === "backlog") {
      where.sprintId = null;
    } else if (sprintId) {
      where.sprintId = sprintId;
    }

    // Filter by status
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status;
    }

    // Filter by assignee
    if (assigneeId) {
      where.assigneeId = assigneeId;
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

  // Validate estimated hours
  if (
    body.estimatedHours !== null &&
    body.estimatedHours !== undefined &&
    body.estimatedHours < 0
  ) {
    return NextResponse.json(
      { error: "Estimated hours must be a positive number" },
      { status: 400 }
    );
  }

  try {
    // Validate parent task exists and belongs to project
    if (body.parentTaskId) {
      const parentTask = await prisma.task.findUnique({
        where: { id: body.parentTaskId },
        select: { projectId: true },
      });

      if (!parentTask) {
        return NextResponse.json(
          { error: "Parent task not found" },
          { status: 404 }
        );
      }

      if (parentTask.projectId !== projectId) {
        return NextResponse.json(
          { error: "Parent task does not belong to this project" },
          { status: 400 }
        );
      }
    }

    // Validate sprint exists and belongs to project
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

    // Validate assignee exists and is a member of the project
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

    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description: body.description || null,
        acceptanceCriteria: body.acceptanceCriteria || null,
        estimatedHours: body.estimatedHours || null,
        projectId,
        sprintId: body.sprintId || null,
        assigneeId: body.assigneeId || null,
        parentTaskId: body.parentTaskId || null,
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

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
