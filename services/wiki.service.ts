import { ApiClient } from "@/lib/api-client";
import type { WikiPage, CreateWikiPageInput, UpdateWikiPageInput } from "@/types/wiki";

export async function getWikiPages(projectId: string) {
  return ApiClient.get<WikiPage[]>(`/api/projects/${projectId}/wiki`);
}

export async function getWikiPageById(projectId: string, pageId: string) {
  return ApiClient.get<WikiPage>(`/api/projects/${projectId}/wiki/${pageId}`);
}

export async function createWikiPage(projectId: string, payload: CreateWikiPageInput) {
  return ApiClient.post<WikiPage>(`/api/projects/${projectId}/wiki`, payload);
}

export async function updateWikiPage(projectId: string, pageId: string, payload: UpdateWikiPageInput) {
  return ApiClient.put<WikiPage>(`/api/projects/${projectId}/wiki/${pageId}`, payload);
}

export async function deleteWikiPage(projectId: string, pageId: string) {
  return ApiClient.delete<{ success: true }>(`/api/projects/${projectId}/wiki/${pageId}`);
}
