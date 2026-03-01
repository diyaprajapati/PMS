import { prisma } from "@/lib/prisma";
import { getUserProjectRole } from "@/lib/project-permissions";

/**
 * Checks if user can modify a task.
 * Allowed: assignee, admin/owner, or developer (developers can update any task/subtask).
 */
export async function canModifyTask(
  userId: string,
  taskId: string
): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        include: {
          user: true
        }
      }
    },
  });

  if (!task) return false;

  // Check if user is assignee
  if (task.assignee?.userId === userId) return true;

  // Check if user is admin/owner/developer – all can modify any task
  const role = await getUserProjectRole(userId, task.projectId);
  return role === "OWNER" || role === "ADMIN" || role === "DEVELOPER";
}

/**
 * Checks if user can delete a task (admin/owner/developer).
 */
export async function canDeleteTask(
  userId: string,
  projectId: string
): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);
  return role === "OWNER" || role === "ADMIN" || role === "DEVELOPER";
}

/**
 * Checks if user can assign tasks (admin/owner/developer).
 * Developers can assign tasks and subtasks to themselves.
 */
export async function canAssignTask(
  userId: string,
  projectId: string
): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);
  return role === "OWNER" || role === "ADMIN" || role === "DEVELOPER";
}
