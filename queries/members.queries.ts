"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMembers,
  addMember,
  updateMemberRole,
  deleteMember,
  type AddMemberPayload,
  type UpdateMemberRolePayload,
  type ProjectMember,
} from "@/services/members.service";

export const memberQueryKeys = {
  all: (projectId: string) => ["members", projectId] as const,
};

export function useMembersQuery(projectId: string | null) {
  return useQuery({
    queryKey: projectId ? memberQueryKeys.all(projectId) : ["members", "no-project"],
    queryFn: () => getMembers(projectId!),
    enabled: !!projectId,
  });
}

export function useAddMemberMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddMemberPayload) => addMember(projectId!, payload),
    onMutate: async (payload) => {
      if (!projectId) return;
      const key = memberQueryKeys.all(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ProjectMember[]>(key);

      queryClient.setQueryData<ProjectMember[]>(key, (old) => {
        if (!old) return old;
        const optimistic: ProjectMember = {
          id: `optimistic-${Date.now()}`,
          userId: `optimistic-user-${Date.now()}`,
          email: payload.email,
          name: null,
          image: null,
          role: payload.role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return [...old, optimistic];
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && projectId) {
        queryClient.setQueryData(memberQueryKeys.all(projectId), context.previous);
      }
    },
    onSettled: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: memberQueryKeys.all(projectId) });
      }
    },
  });
}

export function useUpdateMemberRoleMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, payload }: { memberId: string; payload: UpdateMemberRolePayload }) =>
      updateMemberRole(projectId!, memberId, payload),
    onMutate: async ({ memberId, payload }) => {
      if (!projectId) return;
      const key = memberQueryKeys.all(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ProjectMember[]>(key);

      queryClient.setQueryData<ProjectMember[]>(key, (old) => {
        if (!old) return old;
        return old.map((m) => (m.id === memberId ? { ...m, role: payload.role } : m));
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && projectId) {
        queryClient.setQueryData(memberQueryKeys.all(projectId), context.previous);
      }
    },
    onSettled: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: memberQueryKeys.all(projectId) });
      }
    },
  });
}

export function useDeleteMemberMutation(projectId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => deleteMember(projectId!, memberId),
    onMutate: async (memberId) => {
      if (!projectId) return;
      const key = memberQueryKeys.all(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ProjectMember[]>(key);

      queryClient.setQueryData<ProjectMember[]>(key, (old) => {
        if (!old) return old;
        return old.filter((m) => m.id !== memberId);
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous && projectId) {
        queryClient.setQueryData(memberQueryKeys.all(projectId), context.previous);
      }
    },
    onSettled: () => {
      if (projectId) {
        void queryClient.invalidateQueries({ queryKey: memberQueryKeys.all(projectId) });
      }
    },
  });
}
