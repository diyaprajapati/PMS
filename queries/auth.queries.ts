"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/services/auth.service";

export const authQueryKeys = {
  currentUser: ["auth", "current-user"] as const,
};

export function useCurrentUserQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: getCurrentUser,
    enabled,
    staleTime: 60_000,
  });
}
