import { ApiClient } from "@/lib/api-client";

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
  return ApiClient.get<Project[]>("/api/projects");
}

export async function getProjectById(projectId: string) {
  return ApiClient.get<Project>(`/api/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  return ApiClient.delete<{ message?: string }>(`/api/projects/${projectId}`);
}

export async function createProject(payload: UpsertProjectPayload) {
  return ApiClient.post<Project>("/api/projects", payload);
}

export async function updateProject(projectId: string, payload: UpsertProjectPayload) {
  return ApiClient.patch<Project>(`/api/projects/${projectId}`, payload);
}
