import { ApiClient } from "@/lib/api-client";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";

export type TaskFilters = {
  sprintId?: string | null | "backlog";
  status?: TaskStatus;
  assigneeId?: string | null;
  priority?: TaskPriority;
  parentTaskId?: string | null;
  includeSubtasks?: boolean;
};

export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  estimatedHours?: number | null;
  sprintId?: string | null;
  assigneeId?: string | null;
  parentTaskId?: string | null;
  priority?: TaskPriority;
};

export type UpdateTaskPayload = {
  title?: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number | null;
  sprintId?: string | null;
  assigneeId?: string | null;
};

export type AssignTaskPayload = {
  assigneeId: string | null;
};

export type MoveTaskPayload = {
  sprintId: string | null;
};

export function getTasks(projectId: string, filters?: TaskFilters) {
  const params: Record<string, unknown> = {};
  if (filters?.sprintId !== undefined) params.sprintId = filters.sprintId;
  if (filters?.status) params.status = filters.status;
  if (filters?.assigneeId !== undefined) params.assigneeId = filters.assigneeId;
  if (filters?.priority) params.priority = filters.priority;
  if (filters?.parentTaskId !== undefined) params.parentTaskId = filters.parentTaskId;
  if (filters?.includeSubtasks) params.includeSubtasks = true;

  return ApiClient.get<Task[]>(`/api/projects/${projectId}/tasks`, params);
}

export function getTaskById(projectId: string, taskId: string) {
  return ApiClient.get<Task>(`/api/projects/${projectId}/tasks/${taskId}`);
}

export function createTask(projectId: string, payload: CreateTaskPayload) {
  return ApiClient.post<Task>(`/api/projects/${projectId}/tasks`, payload);
}

export function updateTask(projectId: string, taskId: string, payload: UpdateTaskPayload) {
  return ApiClient.patch<Task>(`/api/projects/${projectId}/tasks/${taskId}`, payload);
}

export function deleteTask(projectId: string, taskId: string) {
  return ApiClient.delete<void>(`/api/projects/${projectId}/tasks/${taskId}`);
}

export function assignTask(projectId: string, taskId: string, payload: AssignTaskPayload) {
  return ApiClient.patch<Task>(`/api/projects/${projectId}/tasks/${taskId}/assign`, payload);
}

export function moveTask(projectId: string, taskId: string, payload: MoveTaskPayload) {
  return ApiClient.patch<Task>(`/api/projects/${projectId}/tasks/${taskId}/move`, payload);
}
