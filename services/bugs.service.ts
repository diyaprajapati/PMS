import { apiClient } from "@/services/http-client";
import type { Bug, BugComment, BugStatus } from "@/types/bug";
import type { TaskPriority } from "@/types/task";

export type ProjectMember = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateBugPayload = {
  title: string;
  description?: string | null;
};

export type UpdateBugPayload = {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: TaskPriority;
  status?: BugStatus;
};

export async function getBugs(projectId: string) {
  return apiClient<Bug[]>(`/api/projects/${projectId}/bugs`);
}

export async function getBugById(projectId: string, bugId: string) {
  return apiClient<Bug>(`/api/projects/${projectId}/bugs/${bugId}`);
}

export async function createBug(projectId: string, payload: CreateBugPayload) {
  return apiClient<Bug>(`/api/projects/${projectId}/bugs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateBug(projectId: string, bugId: string, payload: UpdateBugPayload) {
  return apiClient<Bug>(`/api/projects/${projectId}/bugs/${bugId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function deleteBug(projectId: string, bugId: string) {
  return apiClient<{ message: string }>(`/api/projects/${projectId}/bugs/${bugId}`, {
    method: "DELETE",
  });
}

export async function createBugComment(projectId: string, bugId: string, content: string) {
  return apiClient<BugComment>(`/api/projects/${projectId}/bugs/${bugId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}

export async function getProjectMembers(projectId: string) {
  return apiClient<ProjectMember[]>(`/api/projects/${projectId}/members`);
}
