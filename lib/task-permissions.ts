import { prisma } from "@/lib/prisma";
import { getUserProjectRole } from "@/lib/project-permissions";

/**
 * Checks if user can modify a task (assignee or admin/owner)
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

  // Check if user is admin/owner
  const role = await getUserProjectRole(userId, task.projectId);
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Checks if user can delete a task (admin/owner only)
 */
export async function canDeleteTask(
  userId: string,
  projectId: string
): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Checks if user can assign tasks (admin/owner only)
 */
export async function canAssignTask(
  userId: string,
  projectId: string
): Promise<boolean> {
  const role = await getUserProjectRole(userId, projectId);
  return role === "OWNER" || role === "ADMIN";
}
