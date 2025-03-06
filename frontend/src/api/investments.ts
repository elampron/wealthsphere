import { api } from './api';

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

export const investmentApi = {
  /**
   * Get all investment accounts
   */
  getAll: async (familyMemberId?: number): Promise<InvestmentAccount[]> => {
    const url = familyMemberId 
      ? `/investment-accounts?family_member_id=${familyMemberId}` 
      : '/investment-accounts';
    return api.get(url);
  },

  /**
   * Get a single investment account by ID
   */
  getById: async (id: number): Promise<InvestmentAccount> => {
    return api.get(`/investment-accounts/${id}`);
  },

  /**
   * Create a new investment account
   */
  create: async (data: InvestmentAccountCreate): Promise<InvestmentAccount> => {
    return api.post('/investment-accounts', data);
  },

  /**
   * Update an existing investment account
   */
  update: async (id: number, data: InvestmentAccountUpdate): Promise<InvestmentAccount> => {
    return api.put(`/investment-accounts/${id}`, data);
  },

  /**
   * Delete an investment account
   */
  delete: async (id: number): Promise<void> => {
    return api.delete(`/investment-accounts/${id}`);
  }
}; 