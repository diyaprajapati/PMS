import { ApiClient } from "@/lib/api-client";
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
  priority?: TaskPriority;
  assigneeId?: string | null;
};

export type UpdateBugPayload = {
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  priority?: TaskPriority;
  status?: BugStatus;
};

export async function getBugs(projectId: string) {
  return ApiClient.get<Bug[]>(`/api/projects/${projectId}/bugs`);
}

export async function getBugById(projectId: string, bugId: string) {
  return ApiClient.get<Bug>(`/api/projects/${projectId}/bugs/${bugId}`);
}

export async function createBug(projectId: string, payload: CreateBugPayload) {
  return ApiClient.post<Bug>(`/api/projects/${projectId}/bugs`, payload);
}

export async function updateBug(projectId: string, bugId: string, payload: UpdateBugPayload) {
  return ApiClient.patch<Bug>(`/api/projects/${projectId}/bugs/${bugId}`, payload);
}

export async function deleteBug(projectId: string, bugId: string) {
  return ApiClient.delete<{ message: string }>(`/api/projects/${projectId}/bugs/${bugId}`);
}

export async function createBugComment(projectId: string, bugId: string, content: string) {
  return ApiClient.post<BugComment>(`/api/projects/${projectId}/bugs/${bugId}/comments`, { content });
}

export async function getProjectMembers(projectId: string) {
  return ApiClient.get<ProjectMember[]>(`/api/projects/${projectId}/members`);
}
