'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api';

export type FamilyMember = {
  id: string;
  name: string;
  relationship: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Other';
  birthdate?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type FamilyMemberCreate = Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>;

/**
 * Hook for fetching all family members
 */
export function useFamilyMembers() {
  return useQuery<FamilyMember[]>({
    queryKey: ['family-members'],
    queryFn: () => api.get('/family-members'),
  });
}

/**
 * Hook for fetching a specific family member by ID
 */
export function useFamilyMember(id: string) {
  return useQuery<FamilyMember>({
    queryKey: ['family-members', id],
    queryFn: () => api.get(`/family-members/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook for creating a new family member
 */
export function useCreateFamilyMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: FamilyMemberCreate) => api.post('/family-members', data),
    onSuccess: () => {
      // Invalidate family members list query to refetch
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });
}

/**
 * Hook for updating a family member
 */
export function useUpdateFamilyMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FamilyMember> }) => 
      api.put(`/family-members/${id}`, data),
    onSuccess: (_, variables) => {
      // Invalidate specific family member and family members list queries
      queryClient.invalidateQueries({ queryKey: ['family-members', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });
}

/**
 * Hook for deleting a family member
 */
export function useDeleteFamilyMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/family-members/${id}`),
    onSuccess: () => {
      // Invalidate family members list query
      queryClient.invalidateQueries({ queryKey: ['family-members'] });
    },
  });
} 