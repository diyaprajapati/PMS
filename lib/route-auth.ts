import { NextResponse } from "next/server";
import { getCurrentUser, type CurrentUser } from "@/lib/get-current-user";
import { hasProjectAccess, canManageProjectMembers, isProjectOwner } from "@/lib/project-permissions";

/**
 * Result type for authentication and authorization checks
 */
export type AuthResult =
  | { success: true; user: CurrentUser; projectId: string }
  | { success: false; response: NextResponse };

/**
 * Options for project access checks
 */
export type ProjectAccessOptions = {
  /**
   * Custom error message for unauthorized access
   */
  errorMessage?: string;
  /**
   * Whether to require project access (default: true)
   */
  requireAccess?: boolean;
  /**
   * Custom permission check function
   */
  permissionCheck?: (userId: string, projectId: string) => Promise<boolean>;
  /**
   * Custom error message for permission check failure
   */
  permissionErrorMessage?: string;
};

/**
 * Validates authentication and extracts project ID from route params.
 * Returns either the authenticated user and projectId, or an error response.
 *
 * @param params - Route params promise containing the project ID
 * @param paramKey - Key in params object that contains the project ID (default: "id")
 * @returns AuthResult with user and projectId, or error response
 *
 * @example
 * ```ts
 * const auth = await requireAuth(context.params);
 * if (!auth.success) return auth.response;
 * const { user, projectId } = auth;
 * ```
 */
export async function requireAuth(
  params: Promise<{ [key: string]: string }>,
  paramKey: string = "id"
): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const routeParams = await params;
  const projectId = routeParams[paramKey];

  if (!projectId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Project ID required" },
        { status: 400 }
      ),
    };
  }

  return { success: true, user, projectId };
}

/**
 * Validates authentication and project access.
 * Returns either the authenticated user and projectId, or an error response.
 *
 * @param params - Route params promise containing the project ID
 * @param options - Configuration options for access checks
 * @returns AuthResult with user and projectId, or error response
 *
 * @example
 * ```ts
 * const auth = await requireProjectAccess(context.params);
 * if (!auth.success) return auth.response;
 * const { user, projectId } = auth;
 * ```
 */
export async function requireProjectAccess(
  params: Promise<{ [key: string]: string }>,
  options: ProjectAccessOptions = {}
): Promise<AuthResult> {
  const {
    errorMessage = "You don't have access to this project",
    requireAccess = true,
    permissionCheck,
    permissionErrorMessage,
  } = options;

  // First check authentication
  const auth = await requireAuth(params);
  if (!auth.success) {
    return auth;
  }

  const { user, projectId } = auth;

  // If access check is disabled, return early
  if (!requireAccess) {
    return { success: true, user, projectId };
  }

  // Use custom permission check if provided
  if (permissionCheck) {
    const hasPermission = await permissionCheck(user.id, projectId);
    if (!hasPermission) {
      return {
        success: false,
        response: NextResponse.json(
          { error: permissionErrorMessage || errorMessage },
          { status: 403 }
        ),
      };
    }
    return { success: true, user, projectId };
  }

  // Default: check project access
  const hasAccess = await hasProjectAccess(user.id, projectId);
  if (!hasAccess) {
    return {
      success: false,
      response: NextResponse.json({ error: errorMessage }, { status: 403 }),
    };
  }

  return { success: true, user, projectId };
}

/**
 * Validates authentication and checks if user can manage project members.
 * Returns either the authenticated user and projectId, or an error response.
 *
 * @param params - Route params promise containing the project ID
 * @returns AuthResult with user and projectId, or error response
 *
 * @example
 * ```ts
 * const auth = await requireMemberManagement(context.params);
 * if (!auth.success) return auth.response;
 * const { user, projectId } = auth;
 * ```
 */
export async function requireMemberManagement(
  params: Promise<{ [key: string]: string }>
): Promise<AuthResult> {
  return requireProjectAccess(params, {
    permissionCheck: canManageProjectMembers,
    permissionErrorMessage:
      "You don't have permission to manage members of this project",
  });
}

/**
 * Validates authentication and checks if user owns the project.
 * Returns either the authenticated user and projectId, or an error response.
 *
 * @param params - Route params promise containing the project ID
 * @param errorMessage - Custom error message for ownership check failure
 * @returns AuthResult with user and projectId, or error response
 *
 * @example
 * ```ts
 * const auth = await requireProjectOwnership(context.params);
 * if (!auth.success) return auth.response;
 * const { user, projectId } = auth;
 * ```
 */
export async function requireProjectOwnership(
  params: Promise<{ [key: string]: string }>,
  errorMessage: string = "Project not found"
): Promise<AuthResult> {
  return requireProjectAccess(params, {
    permissionCheck: isProjectOwner,
    permissionErrorMessage: errorMessage,
  });
}

/**
 * Validates authentication only (no project access check).
 * Useful for routes that don't require project context.
 *
 * @returns AuthResult with user, or error response
 *
 * @example
 * ```ts
 * const auth = await requireAuthOnly();
 * if (!auth.success) return auth.response;
 * const { user } = auth;
 * ```
 */
export async function requireAuthOnly(): Promise<
  | { success: true; user: CurrentUser }
  | { success: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { success: true, user };
}
