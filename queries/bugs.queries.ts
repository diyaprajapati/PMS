"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBug,
  createBugComment,
  deleteBug,
  getBugById,
  getBugs,
  getProjectMembers,
  type CreateBugPayload,
  type UpdateBugPayload,
  updateBug,
} from "@/services/bugs.service";

export const bugQueryKeys = {
  all: (projectId: string) => ["bugs", projectId] as const,
  detail: (projectId: string, bugId: string) => ["bugs", projectId, bugId] as const,
  members: (projectId: string) => ["project-members", projectId] as const,
};

export function useBugsQuery(projectId: string | null) {
  return useQuery({
    queryKey: projectId ? bugQueryKeys.all(projectId) : ["bugs", "no-project"],
    queryFn: () => getBugs(projectId!),
    enabled: !!projectId,
    staleTime: 30_000, // 30s – avoid refetch on every mount when navigating back
  });
}

export function useBugDetailQuery(projectId: string | null, bugId: string | null) {
  return useQuery({
    queryKey: projectId && bugId ? bugQueryKeys.detail(projectId, bugId) : ["bug", "no-selection"],
    queryFn: () => getBugById(projectId!, bugId!),
    enabled: !!projectId && !!bugId,
  });
}

export function useProjectMembersQuery(projectId: string | null) {
  return useQuery({
    queryKey: projectId ? bugQueryKeys.members(projectId) : ["project-members", "no-project"],
    queryFn: () => getProjectMembers(projectId!),
    enabled: !!projectId,
    staleTime: 60_000, // 1 min – members change rarely; speeds up bugs/sprints/backlog
  });
}

export function useCreateBugMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBugPayload) => createBug(projectId!, payload),
    onSuccess: () => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: bugQueryKeys.all(projectId) });
    },
  });
}

export function useUpdateBugMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bugId, payload }: { bugId: string; payload: UpdateBugPayload }) =>
      updateBug(projectId!, bugId, payload),
    onSuccess: (_, variables) => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: bugQueryKeys.all(projectId) });
      if (variables.bugId) {
        void queryClient.invalidateQueries({
          queryKey: bugQueryKeys.detail(projectId, variables.bugId),
        });
      }
    },
  });
}

export function useDeleteBugMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bugId: string) => deleteBug(projectId!, bugId),
    onSuccess: (_data, bugId) => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: bugQueryKeys.all(projectId) });
      void queryClient.invalidateQueries({ queryKey: bugQueryKeys.detail(projectId, bugId) });
    },
  });
}

export function useCreateBugCommentMutation(projectId: string | null, bugId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => createBugComment(projectId!, bugId!, content),
    onSuccess: () => {
      if (!projectId || !bugId) return;
      void queryClient.invalidateQueries({ queryKey: bugQueryKeys.detail(projectId, bugId) });
    },
  });
}
