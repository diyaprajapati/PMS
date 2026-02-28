import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectAccess } from "@/lib/route-auth";
import { sendTaskAssignedEmail } from "@/lib/email";
import { getUserProjectRole } from "@/lib/project-permissions";
import { canAssignTask } from "@/lib/task-permissions";
import { canAssignRoleTo } from "@/lib/role-rank";

type RouteContext = { params: Promise<{ id: string; taskId: string }> };

// PATCH /api/projects/[id]/tasks/[taskId]/assign – assign task to a member
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

  let body: {
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

  if (body.assigneeId === undefined) {
    return NextResponse.json(
      { error: "assigneeId is required" },
      { status: 400 }
    );
  }

  // Validate roles and membership
  const canAssign = await canAssignTask(user.id, projectId);
  if (!canAssign) {
    return NextResponse.json(
      { error: "You don't have permission to assign tasks" },
      { status: 403 }
    );
  }

  const actorRole = await getUserProjectRole(user.id, projectId);
  if (!actorRole) {
    return NextResponse.json(
      { error: "You are not a member of this project" },
      { status: 403 }
    );
  }

  if (body.assigneeId) {
    const member = await prisma.projectMember.findUnique({
      where: { id: body.assigneeId },
      select: {
        id: true,
        projectId: true,
        role: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
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

    const allowed = canAssignRoleTo(actorRole, member.role);
    if (!allowed) {
      return NextResponse.json(
        { error: "You cannot assign tasks to a higher role" },
        { status: 403 }
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
        assigneeId: body.assigneeId,
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            subtasks: true,
          },
        },
      },
    });

    // Fire-and-forget assignment email (do not block response)
    if (updatedTask.assignee && body.assigneeId) {
      const assignee = await prisma.projectMember.findUnique({
        where: { id: updatedTask.assigneeId! },
        select: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      if (assignee?.user?.email) {
        void sendTaskAssignedEmail({
          toEmail: assignee.user.email,
          assigneeName: assignee.user.name,
          assignerName: user?.name ?? null,
          assignerEmail: user?.email ?? "",
          projectName: updatedTask.project?.name ?? "Project",
          taskTitle: updatedTask.title,
          projectId: projectId,
        }).catch((err) => {
          console.error("Failed to send task assignment email:", err);
        });
      }
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("Error assigning task:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to assign task" },
      { status: 500 }
    );
  }
}
