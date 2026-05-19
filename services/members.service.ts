import { ApiClient } from "@/lib/api-client";

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

export type AddMemberPayload = {
  email: string;
  role: "ADMIN" | "DEVELOPER" | "CLIENT";
};

export type UpdateMemberRolePayload = {
  role: "ADMIN" | "DEVELOPER" | "CLIENT";
};

export function getMembers(projectId: string) {
  return ApiClient.get<ProjectMember[]>(`/api/projects/${projectId}/members`);
}

export function addMember(projectId: string, payload: AddMemberPayload) {
  return ApiClient.post<ProjectMember>(`/api/projects/${projectId}/members`, payload);
}

export function updateMemberRole(projectId: string, memberId: string, payload: UpdateMemberRolePayload) {
  return ApiClient.patch<ProjectMember>(`/api/projects/${projectId}/members/${memberId}`, payload);
}

export function deleteMember(projectId: string, memberId: string) {
  return ApiClient.delete<void>(`/api/projects/${projectId}/members/${memberId}`);
}
