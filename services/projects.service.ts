import { apiClient } from "@/services/http-client";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
  myRole?: string;
  members?: Array<{ id: string; user: { name: string | null; image: string | null } }>;
  _count?: { members: number };
};

export type UpsertProjectPayload = {
  name: string;
  description?: string | null;
};

export async function getProjects() {
  return apiClient<Project[]>("/api/projects");
}

export async function getProjectById(projectId: string) {
  return apiClient<Project>(`/api/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  return apiClient<{ message?: string }>(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}

export async function createProject(payload: UpsertProjectPayload) {
  return apiClient<Project>("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateProject(projectId: string, payload: UpsertProjectPayload) {
  return apiClient<Project>(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
