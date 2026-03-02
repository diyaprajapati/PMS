/**
 * Returns true if an actor with role `actorRole` is allowed
 * to assign a task to a member with role `targetRole`.
 *
 * Rules:
 * - CLIENT cannot assign tasks at all.
 * - OWNER, ADMIN, and DEVELOPER can assign tasks to any role.
 */
export function canAssignRoleTo(
  actorRole: "OWNER" | "ADMIN" | "DEVELOPER" | "CLIENT",
  // `targetRole` is kept for future extensibility and clarity of intent
  targetRole: "OWNER" | "ADMIN" | "DEVELOPER" | "CLIENT"
): boolean {
  if (actorRole === "CLIENT") return false;
  return true;
}
