"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  moveTask,
  type CreateTaskPayload,
  type UpdateTaskPayload,
  type AssignTaskPayload,
  type MoveTaskPayload,
  type TaskFilters,
} from "@/services/tasks.service";
import type { Task } from "@/types/task";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const taskQueryKeys = {
  all: (projectId: string) => ["tasks", projectId] as const,
  list: (projectId: string, filters?: TaskFilters) =>
    ["tasks", projectId, "list", filters ?? {}] as const,
  detail: (projectId: string, taskId: string) =>
    ["tasks", projectId, "detail", taskId] as const,
};

// ---------------------------------------------------------------------------
// Tree helpers
// ---------------------------------------------------------------------------

function updateTaskInList(tasks: Task[], id: string, patch: Partial<Task>): Task[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, ...patch }
      : t.subtasks
      ? { ...t, subtasks: updateTaskInList(t.subtasks, id, patch) }
      : t
  );
}

function replaceTaskInList(tasks: Task[], id: string, next: Task): Task[] {
  return tasks.map((t) =>
    t.id === id
      ? { ...t, ...next }
      : t.subtasks
      ? { ...t, subtasks: replaceTaskInList(t.subtasks, id, next) }
      : t
  );
}

function addSubtaskToList(tasks: Task[], parentId: string, sub: Task): Task[] {
  return tasks.map((t) =>
    t.id === parentId
      ? {
          ...t,
          subtasks: [...(t.subtasks ?? []), sub],
          _count: { subtasks: (t._count?.subtasks ?? 0) + 1 },
        }
      : t.subtasks
      ? { ...t, subtasks: addSubtaskToList(t.subtasks, parentId, sub) }
      : t
  );
}

function removeTaskFromList(tasks: Task[], id: string): Task[] {
  return tasks
    .filter((t) => t.id !== id)
    .map((t) =>
      t.subtasks
        ? {
            ...t,
            subtasks: removeTaskFromList(t.subtasks, id),
            _count: { subtasks: t.subtasks.filter((s) => s.id !== id).length },
          }
        : t
    );
}

function findTaskInList(tasks: Task[], id: string): Task | undefined {
  for (const t of tasks) {
    if (t.id === id) return t;
    if (t.subtasks) {
      const found = findTaskInList(t.subtasks, id);
      if (found) return found;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useTasksQuery(projectId: string | null, filters?: TaskFilters) {
  return useQuery({
    queryKey: projectId ? taskQueryKeys.list(projectId, filters) : ["tasks", "no-project"],
    queryFn: () => getTasks(projectId!, filters),
    enabled: !!projectId,
  });
}

export function useTaskDetailQuery(projectId: string | null, taskId: string | null) {
  return useQuery({
    queryKey: projectId && taskId ? taskQueryKeys.detail(projectId, taskId) : ["tasks", "no-selection"],
    queryFn: () => getTaskById(projectId!, taskId!),
    enabled: !!projectId && !!taskId,
  });
}

// ---------------------------------------------------------------------------
// Mutations with optimistic updates
// ---------------------------------------------------------------------------

export function useCreateTaskMutation(projectId: string | null, filters?: TaskFilters) {
  const queryClient = useQueryClient();
  const listKey = projectId ? taskQueryKeys.list(projectId, filters) : null;

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(projectId!, payload),
    onMutate: async (payload) => {
      if (!listKey) return;
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);

      // Build optimistic task
      const optimisticTask: Task = {
        id: `optimistic-${Date.now()}`,
        title: payload.title,
        description: payload.description ?? null,
        acceptanceCriteria: payload.acceptanceCriteria ?? null,
        status: "TODO",
        priority: payload.priority ?? "P3",
        estimatedHours: payload.estimatedHours ?? null,
        projectId: projectId!,
        sprintId: payload.sprintId ?? null,
        assigneeId: payload.assigneeId ?? null,
        parentTaskId: payload.parentTaskId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        subtasks: [],
        _count: { subtasks: 0 },
      };

      queryClient.setQueryData<Task[]>(listKey, (old) => {
        if (!old) return old;
        if (payload.parentTaskId) {
          return addSubtaskToList(old, payload.parentTaskId, optimisticTask);
        }
        return [optimisticTask, ...old];
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && listKey) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSettled: () => {
      if (listKey) {
        void queryClient.invalidateQueries({ queryKey: listKey });
      }
    },
  });
}

export function useUpdateTaskMutation(projectId: string | null, filters?: TaskFilters) {
  const queryClient = useQueryClient();
  const listKey = projectId ? taskQueryKeys.list(projectId, filters) : null;

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: UpdateTaskPayload }) =>
      updateTask(projectId!, taskId, payload),
    onMutate: async ({ taskId, payload }) => {
      if (!listKey) return;
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);

      queryClient.setQueryData<Task[]>(listKey, (old) => {
        if (!old) return old;
        return updateTaskInList(old, taskId, payload);
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && listKey) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      if (listKey) {
        void queryClient.invalidateQueries({ queryKey: listKey });
      }
      if (projectId && variables?.taskId) {
        void queryClient.invalidateQueries({
          queryKey: taskQueryKeys.detail(projectId, variables.taskId),
        });
      }
    },
  });
}

export function useDeleteTaskMutation(projectId: string | null, filters?: TaskFilters) {
  const queryClient = useQueryClient();
  const listKey = projectId ? taskQueryKeys.list(projectId, filters) : null;

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(projectId!, taskId),
    onMutate: async (taskId) => {
      if (!listKey) return;
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);

      queryClient.setQueryData<Task[]>(listKey, (old) => {
        if (!old) return old;
        return removeTaskFromList(old, taskId);
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && listKey) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSettled: () => {
      if (listKey) {
        void queryClient.invalidateQueries({ queryKey: listKey });
      }
    },
  });
}

export function useAssignTaskMutation(projectId: string | null, filters?: TaskFilters) {
  const queryClient = useQueryClient();
  const listKey = projectId ? taskQueryKeys.list(projectId, filters) : null;

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: AssignTaskPayload }) =>
      assignTask(projectId!, taskId, payload),
    onMutate: async ({ taskId, payload }) => {
      if (!listKey) return;
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);

      queryClient.setQueryData<Task[]>(listKey, (old) => {
        if (!old) return old;
        return updateTaskInList(old, taskId, { assigneeId: payload.assigneeId });
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && listKey) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      if (listKey) {
        void queryClient.invalidateQueries({ queryKey: listKey });
      }
      if (projectId && variables?.taskId) {
        void queryClient.invalidateQueries({
          queryKey: taskQueryKeys.detail(projectId, variables.taskId),
        });
      }
    },
  });
}

export function useMoveTaskMutation(projectId: string | null, filters?: TaskFilters) {
  const queryClient = useQueryClient();
  const listKey = projectId ? taskQueryKeys.list(projectId, filters) : null;

  return useMutation({
    mutationFn: ({ taskId, payload }: { taskId: string; payload: MoveTaskPayload }) =>
      moveTask(projectId!, taskId, payload),
    onMutate: async ({ taskId, payload }) => {
      if (!listKey) return;
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);

      queryClient.setQueryData<Task[]>(listKey, (old) => {
        if (!old) return old;
        return updateTaskInList(old, taskId, { sprintId: payload.sprintId });
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && listKey) {
        queryClient.setQueryData(listKey, context.previous);
      }
    },
    onSettled: () => {
      if (listKey) {
        void queryClient.invalidateQueries({ queryKey: listKey });
      }
    },
  });
}
