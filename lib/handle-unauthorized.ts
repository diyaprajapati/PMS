import { ApiError } from "@/lib/api-client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function handleUnauthorizedError(error: unknown, router: AppRouterInstance) {
  if (error instanceof ApiError && error.status === 401) {
    router.replace("/login");
    return true;
  }
  return false;
}

