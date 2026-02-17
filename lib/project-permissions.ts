import { prisma } from "@/lib/prisma";
import { CurrentUser } from "@/lib/get-current-user";

/**
 * Checks if a user has permission to manage members of a project.
 * Returns true if user is the project owner or has ADMIN role.
 */
export async function canManageProjectMembers(
  userId: string,
  projectId: string
): Promise<boolean> {
  // Check if user is the project owner
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (project) {
    return true; // User is the owner
  }

  // Check if user is an admin member
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
      role: "ADMIN",
    },
  });

  return !!membership;
}

/**
 * Checks if a user has access to a project (owner or member).
 */
export async function hasProjectAccess(
  userId: string,
  projectId: string
): Promise<boolean> {
  // Check if user is the project owner
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (project) {
    return true;
  }

  // Check if user is a member
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
    },
  });

  return !!membership;
}

/**
 * Gets the user's role in a project (OWNER, ADMIN, DEVELOPER, CLIENT, or null).
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<"OWNER" | "ADMIN" | "DEVELOPER" | "CLIENT" | null> {
  // Check if user is the project owner
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (project) {
    return "OWNER";
  }

  // Get membership role
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
    },
    select: {
      role: true,
    },
  });

  return membership?.role || null;
}
