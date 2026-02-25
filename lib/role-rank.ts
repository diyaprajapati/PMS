const ROLE_RANK = {
  OWNER: 4,
  ADMIN: 3,
  DEVELOPER: 2,
  CLIENT: 1,
};

export type ProjectRoleKey = keyof typeof ROLE_RANK;

export function getRoleRank(role: ProjectRoleKey): number {
  return ROLE_RANK[role];
}

/**
 * Returns true if an actor with role `actorRole` is allowed
 * to assign a task to a member with role `targetRole`.
 *
 * Rules:
 * - CLIENT cannot assign tasks at all.
 * - Actor may assign to themselves, same role, or lower role.
 * - OWNER has full permissions (can assign to anyone).
 */
export function canAssignRoleTo(
  actorRole: ProjectRoleKey,
  targetRole: ProjectRoleKey
): boolean {
  if (actorRole === "CLIENT") return false;
  const actorRank = getRoleRank(actorRole);
  const targetRank = getRoleRank(targetRole);
  return actorRank >= targetRank;
}

