"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  createProject,
  deleteProject,
  type UpsertProjectPayload,
  updateProject,
  type Project,
} from "@/services/projects.service";

export const projectQueryKeys = {
  all: ["projects"] as const,
};

export function useProjectsQuery() {
  return useQuery({
    queryKey: projectQueryKeys.all,
    queryFn: getProjects,
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: projectQueryKeys.all });
      const previous = queryClient.getQueryData<Project[]>(projectQueryKeys.all);

      queryClient.setQueryData<Project[]>(projectQueryKeys.all, (old) => {
        if (!old) return old;
        return old.filter((p) => p.id !== projectId);
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectQueryKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertProjectPayload) => createProject(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: projectQueryKeys.all });
      const previous = queryClient.getQueryData<Project[]>(projectQueryKeys.all);

      queryClient.setQueryData<Project[]>(projectQueryKeys.all, (old) => {
        if (!old) return old;
        const optimistic: Project = {
          id: `optimistic-${Date.now()}`,
          name: payload.name,
          description: payload.description ?? null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [optimistic, ...old];
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectQueryKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: UpsertProjectPayload;
    }) => updateProject(projectId, payload),
    onMutate: async ({ projectId, payload }) => {
      await queryClient.cancelQueries({ queryKey: projectQueryKeys.all });
      const previous = queryClient.getQueryData<Project[]>(projectQueryKeys.all);

      queryClient.setQueryData<Project[]>(projectQueryKeys.all, (old) => {
        if (!old) return old;
        return old.map((p) => (p.id === projectId ? { ...p, ...payload } : p));
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectQueryKeys.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });
}
