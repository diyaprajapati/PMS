"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWikiPages,
  getWikiPageById,
  createWikiPage,
  updateWikiPage,
  deleteWikiPage,
} from "@/services/wiki.service";
import type { WikiPage, CreateWikiPageInput, UpdateWikiPageInput } from "@/types/wiki";

export const wikiQueryKeys = {
  all: (projectId: string) => ["wiki-pages", projectId] as const,
  detail: (projectId: string, pageId: string) =>
    ["wiki-pages", projectId, pageId] as const,
};

export function useWikiPagesQuery(projectId: string | null) {
  return useQuery({
    queryKey: projectId ? wikiQueryKeys.all(projectId) : ["wiki-pages", "no-project"],
    queryFn: () => getWikiPages(projectId!),
    enabled: !!projectId,
  });
}

export function useWikiPageQuery(projectId: string | null, pageId: string | null) {
  return useQuery({
    queryKey:
      projectId && pageId
        ? wikiQueryKeys.detail(projectId, pageId)
        : ["wiki-page", "no-selection"],
    queryFn: () => getWikiPageById(projectId!, pageId!),
    enabled: !!projectId && !!pageId,
  });
}

export function useCreateWikiPageMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateWikiPageInput) =>
      createWikiPage(projectId!, payload),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: wikiQueryKeys.all(projectId),
        });
      }
    },
  });
}

export function useUpdateWikiPageMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pageId,
      payload,
    }: {
      pageId: string;
      payload: UpdateWikiPageInput;
    }) => updateWikiPage(projectId!, pageId, payload),
    onSuccess: (_data, variables) => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: wikiQueryKeys.all(projectId),
        });
        void queryClient.invalidateQueries({
          queryKey: wikiQueryKeys.detail(projectId, variables.pageId),
        });
      }
    },
  });
}

export function useDeleteWikiPageMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => deleteWikiPage(projectId!, pageId),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: wikiQueryKeys.all(projectId),
        });
      }
    },
  });
}
