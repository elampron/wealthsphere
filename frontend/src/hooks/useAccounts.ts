'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api';

export type Account = {
  id: string;
  name: string;
  type: 'RRSP' | 'TFSA' | 'Non-Registered';
  balance: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type AccountCreate = Omit<Account, 'id' | 'created_at' | 'updated_at'>;

/**
 * Hook for fetching all accounts
 */
export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
  });
}

/**
 * Hook for fetching a specific account by ID
 */
export function useAccount(id: string) {
  return useQuery<Account>({
    queryKey: ['accounts', id],
    queryFn: () => api.get(`/accounts/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook for creating a new account
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AccountCreate) => api.post('/accounts', data),
    onSuccess: () => {
      // Invalidate accounts list query to refetch
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

/**
 * Hook for updating an account
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Account> }) => 
      api.put(`/accounts/${id}`, data),
    onSuccess: (_, variables) => {
      // Invalidate specific account and accounts list queries
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

/**
 * Hook for deleting an account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      // Invalidate accounts list query
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
} 