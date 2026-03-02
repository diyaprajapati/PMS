import { apiClient } from "@/services/http-client";

export type Sprint = {
  id: string;
  title: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  projectId: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateSprintPayload = {
  title: string;
  startDate?: Date;
  endDate?: Date;
  transferUnfinishedTasks?: boolean;
};

export type UpdateSprintPayload = {
  title?: string;
  status?: string;
  startDate?: Date | null;
  endDate?: Date | null;
};

export async function getSprints(projectId: string) {
  return apiClient<Sprint[]>(`/api/projects/${projectId}/sprints`);
}

export async function getSprintById(projectId: string, sprintId: string) {
  return apiClient<Sprint>(`/api/projects/${projectId}/sprints/${sprintId}`);
}

export async function createSprint(projectId: string, payload: CreateSprintPayload) {
  return apiClient<Sprint>(`/api/projects/${projectId}/sprints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateSprint(projectId: string, sprintId: string, payload: UpdateSprintPayload) {
  return apiClient<Sprint>(`/api/projects/${projectId}/sprints/${sprintId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteSprint(projectId: string, sprintId: string) {
  return apiClient<{ message?: string }>(`/api/projects/${projectId}/sprints/${sprintId}`, {
    method: "DELETE",
  });
}
