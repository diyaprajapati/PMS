"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getBugs,
  getBugById,
  createBug,
  updateBug,
  deleteBug,
  createBugComment,
  getProjectMembers,
  type CreateBugPayload,
  type UpdateBugPayload,
} from "@/services/bugs.service";
import type { Bug, BugStatus } from "@/types/bug";
import type { TaskPriority } from "@/types/task";

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
    staleTime: 60_000,
  });
}

export function useCreateBugMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBugPayload) => createBug(projectId!, payload),
    onMutate: async (payload) => {
      if (!projectId) return;
      const key = bugQueryKeys.all(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Bug[]>(key);

      queryClient.setQueryData<Bug[]>(key, (old) => {
        if (!old) return old;
        const optimistic: Bug = {
          id: `optimistic-${Date.now()}`,
          bugNumber: old.length > 0 ? Math.max(...old.map((b) => b.bugNumber)) + 1 : 1,
          title: payload.title,
          description: payload.description ?? null,
          priority: payload.priority ?? "P3",
          status: "NOT_STARTED",
          projectId: projectId!,
          assigneeId: payload.assigneeId ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignee: null,
          comments: [],
        };
        return [optimistic, ...old];
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && projectId) {
        queryClient.setQueryData(bugQueryKeys.all(projectId), context.previous);
      }
    },
    onSettled: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: bugQueryKeys.all(projectId) });
      }
    },
  });
}

export function useUpdateBugMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bugId, payload }: { bugId: string; payload: UpdateBugPayload }) =>
      updateBug(projectId!, bugId, payload),
    onMutate: async ({ bugId, payload }) => {
      if (!projectId) return;
      const key = bugQueryKeys.all(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Bug[]>(key);

      queryClient.setQueryData<Bug[]>(key, (old) => {
        if (!old) return old;
        return old.map((b) => (b.id === bugId ? { ...b, ...payload } : b));
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && projectId) {
        queryClient.setQueryData(bugQueryKeys.all(projectId), context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: bugQueryKeys.all(projectId) });
      }
      if (projectId && variables?.bugId) {
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
    onMutate: async (bugId) => {
      if (!projectId) return;
      const key = bugQueryKeys.all(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Bug[]>(key);

      queryClient.setQueryData<Bug[]>(key, (old) => {
        if (!old) return old;
        return old.filter((b) => b.id !== bugId);
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && projectId) {
        queryClient.setQueryData(bugQueryKeys.all(projectId), context.previous);
      }
    },
    onSettled: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: bugQueryKeys.all(projectId) });
      }
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
