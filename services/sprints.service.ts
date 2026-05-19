import { ApiClient } from "@/lib/api-client";
import type { SprintStatus } from "@/types/task";

export type Sprint = {
  id: string;
  title: string;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSprintPayload = {
  title: string;
  startDate?: Date;
  endDate?: Date;
  transferUnfinishedTasks?: boolean;
};

export type UpdateSprintPayload = {
  title?: string;
  status?: SprintStatus;
  startDate?: Date | null;
  endDate?: Date | null;
};

export async function getSprints(projectId: string) {
  return ApiClient.get<Sprint[]>(`/api/projects/${projectId}/sprints`);
}

export async function getSprintById(projectId: string, sprintId: string) {
  return ApiClient.get<Sprint>(`/api/projects/${projectId}/sprints/${sprintId}`);
}

export async function createSprint(projectId: string, payload: CreateSprintPayload) {
  return ApiClient.post<Sprint>(`/api/projects/${projectId}/sprints`, payload);
}

export async function updateSprint(projectId: string, sprintId: string, payload: UpdateSprintPayload) {
  return ApiClient.patch<Sprint>(`/api/projects/${projectId}/sprints/${sprintId}`, payload);
}

export async function deleteSprint(projectId: string, sprintId: string) {
  return ApiClient.delete<{ message?: string }>(`/api/projects/${projectId}/sprints/${sprintId}`);
}
