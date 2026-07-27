'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPolicies, createPolicy, updatePolicy, deletePolicy } from '@/lib/api/policies';

export function usePolicies() {
  return useQuery({
    queryKey: ['policies'],
    queryFn: getPolicies,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; category: string; content?: string }) => createPolicy(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] }),
  });
}

export function useUpdatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ policyId, body }: { policyId: string; body: { name?: string; category?: string } }) =>
      updatePolicy(policyId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] }),
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (policyId: string) => deletePolicy(policyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['policies'] }),
  });
}
