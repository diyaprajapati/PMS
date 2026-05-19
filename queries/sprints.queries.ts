"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSprints,
  createSprint,
  updateSprint,
  deleteSprint,
  type CreateSprintPayload,
  type UpdateSprintPayload,
  type Sprint,
} from "@/services/sprints.service";

export const sprintQueryKeys = {
  all: (projectId: string) => ["sprints", projectId] as const,
};

export function useSprintsQuery(projectId: string | null) {
  return useQuery({
    queryKey: projectId ? sprintQueryKeys.all(projectId) : ["sprints", "no-project"],
    queryFn: () => getSprints(projectId!),
    enabled: !!projectId,
  });
}

export function useCreateSprintMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSprintPayload) => createSprint(projectId!, payload),
    onMutate: async (payload) => {
      if (!projectId) return;
      const key = sprintQueryKeys.all(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Sprint[]>(key);

      queryClient.setQueryData<Sprint[]>(key, (old) => {
        if (!old) return old;
        const optimistic: Sprint = {
          id: `optimistic-${Date.now()}`,
          title: payload.title,
          status: "NOT_STARTED",
          startDate: payload.startDate ? payload.startDate.toISOString() : null,
          endDate: payload.endDate ? payload.endDate.toISOString() : null,
          projectId: projectId!,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [...old, optimistic];
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && projectId) {
        queryClient.setQueryData(sprintQueryKeys.all(projectId), context.previous);
      }
    },
    onSettled: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: sprintQueryKeys.all(projectId) });
      }
    },
  });
}

export function useUpdateSprintMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sprintId, payload }: { sprintId: string; payload: UpdateSprintPayload }) =>
      updateSprint(projectId!, sprintId, payload),
    onMutate: async ({ sprintId, payload }) => {
      if (!projectId) return;
      const key = sprintQueryKeys.all(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Sprint[]>(key);

      queryClient.setQueryData<Sprint[]>(key, (old) => {
        if (!old) return old;
        return old.map((s) =>
          s.id === sprintId
            ? {
                ...s,
                ...payload,
                startDate: payload.startDate ? (payload.startDate instanceof Date ? payload.startDate.toISOString() : payload.startDate) : s.startDate,
                endDate: payload.endDate ? (payload.endDate instanceof Date ? payload.endDate.toISOString() : payload.endDate) : s.endDate,
              }
            : s
        );
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && projectId) {
        queryClient.setQueryData(sprintQueryKeys.all(projectId), context.previous);
      }
    },
    onSettled: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: sprintQueryKeys.all(projectId) });
      }
    },
  });
}

export function useDeleteSprintMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sprintId: string) => deleteSprint(projectId!, sprintId),
    onMutate: async (sprintId) => {
      if (!projectId) return;
      const key = sprintQueryKeys.all(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Sprint[]>(key);

      queryClient.setQueryData<Sprint[]>(key, (old) => {
        if (!old) return old;
        return old.filter((s) => s.id !== sprintId);
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && projectId) {
        queryClient.setQueryData(sprintQueryKeys.all(projectId), context.previous);
      }
    },
    onSettled: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: sprintQueryKeys.all(projectId) });
      }
    },
  });
}
