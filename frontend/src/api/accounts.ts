import { api } from './api';

export interface Account {
  id: string;
  account_name: string;
  account_type: string;
}

export interface AccountCreate {
  account_name: string;
  account_type: string;
}

export const accountsApi = {
  getAll: () => api.get<Account[]>('/accounts'),
  get: (id: string) => api.get<Account>(`/accounts/${id}`),
  create: (data: AccountCreate) => api.post<Account>('/accounts', data),
  update: (id: string, data: Partial<AccountCreate>) => api.put<Account>(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
}; 