'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/api';

export type Expense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  recurring: boolean;
  interval?: 'monthly' | 'yearly' | 'weekly';
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type ExpenseCreate = Omit<Expense, 'id' | 'created_at' | 'updated_at'>;

/**
 * Hook for fetching all expenses
 */
export function useExpenses() {
  return useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: () => api.get('/expenses'),
  });
}

/**
 * Hook for fetching a specific expense by ID
 */
export function useExpense(id: string) {
  return useQuery<Expense>({
    queryKey: ['expenses', id],
    queryFn: () => api.get(`/expenses/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook for creating a new expense
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: ExpenseCreate) => api.post('/expenses', data),
    onSuccess: () => {
      // Invalidate expenses list query to refetch
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

/**
 * Hook for updating an expense
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) => 
      api.put(`/expenses/${id}`, data),
    onSuccess: (_, variables) => {
      // Invalidate specific expense and expense list queries
      queryClient.invalidateQueries({ queryKey: ['expenses', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

/**
 * Hook for deleting an expense
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      // Invalidate expense list query
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
} 