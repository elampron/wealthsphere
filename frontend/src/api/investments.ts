import { api } from './api';
import { InvestmentAccount, EntityValue } from '@/types/finance';

export enum AccountTypeEnum {
  RRSP = "RRSP",
  TFSA = "TFSA",
  NON_REGISTERED = "NON_REGISTERED",
  RRIF = "RRIF",
  RESP = "RESP",
  LIRA = "LIRA",
  FHSA = "FHSA",
  CORPORATION = "CORPORATION"
}

export interface InvestmentAccount {
  id: number;
  name: string;
  account_type: string;
  current_balance: number;
  expected_return_rate: number;
  institution?: string | null;
  is_taxable?: boolean;
  notes?: string | null;
  contribution_room?: number | null;
  expected_conversion_year?: number | null;
  family_member_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface InvestmentAccountCreate {
  name: string;
  account_type: string;
  current_balance: number;
  expected_return_rate: number;
  institution?: string | null;
  is_taxable?: boolean;
  notes?: string | null;
  contribution_room?: number | null;
  expected_conversion_year?: number | null;
  family_member_id: number;
}

export interface InvestmentAccountUpdate {
  name?: string;
  account_type?: string;
  current_balance?: number;
  expected_return_rate?: number;
  institution?: string | null;
  is_taxable?: boolean;
  notes?: string | null;
  contribution_room?: number | null;
  expected_conversion_year?: number | null;
  family_member_id?: number;
}

interface CreateAccountData {
  name: string;
  account_type: string;
  institution?: string;
  initial_value?: number;
  expected_return_rate: number;
  is_taxable: boolean;
  contribution_room?: number;
  expected_conversion_year?: number;
  notes?: string;
  family_member_id: number;
}

interface UpdateAccountData {
  name?: string;
  account_type?: string;
  institution?: string;
  expected_return_rate?: number;
  is_taxable?: boolean;
  contribution_room?: number;
  expected_conversion_year?: number;
  notes?: string;
  family_member_id?: number;
}

export const investmentsApi = {
  getAccounts: async (): Promise<InvestmentAccount[]> => {
    const response = await api.get<{ data: InvestmentAccount[] }>('/investment-accounts');
    return response.data;
  },

  getAccount: async (id: number): Promise<InvestmentAccount> => {
    const response = await api.get<{ data: InvestmentAccount }>(`/investment-accounts/${id}`);
    return response.data;
  },

  createAccount: async (data: CreateAccountData): Promise<InvestmentAccount> => {
    const response = await api.post<{ data: InvestmentAccount }>('/investment-accounts', data);
    return response.data;
  },

  updateAccount: async (id: number, data: UpdateAccountData): Promise<InvestmentAccount> => {
    const response = await api.put<{ data: InvestmentAccount }>(`/investment-accounts/${id}`, data);
    return response.data;
  },

  deleteAccount: async (id: number): Promise<void> => {
    await api.delete(`/investment-accounts/${id}`);
  },

  setValue: async (id: number, value: number): Promise<EntityValue> => {
    const response = await api.post<{ data: EntityValue }>(`/investment-accounts/${id}/value`, { value });
    return response.data;
  }
}; 