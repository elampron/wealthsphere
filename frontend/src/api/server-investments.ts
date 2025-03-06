/**
 * Server-side investments API for fetching investment data from the backend
 * This should only be used in Server Components
 */

import { serverApi } from './server';

// Define investment types based on your backend API
export interface InvestmentAccount {
  id: string;
  name: string;
  account_type: string;
  institution: string;
  balance: number;
  family_member_id: string;
  family_member_name?: string;
  contributions_ytd?: number;
  opened_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export enum AccountTypeEnum {
  TFSA = 'TFSA',
  RRSP = 'RRSP',
  RESP = 'RESP',
  CASH = 'CASH',
  MARGIN = 'MARGIN',
  OTHER = 'OTHER',
}

// Server-side investment API
export const serverInvestmentApi = {
  // Get all investment accounts
  getAll: async (): Promise<InvestmentAccount[]> => {
    return serverApi.get<InvestmentAccount[]>('/investment-accounts');
  },

  // Get a specific investment account by ID
  getById: async (id: string): Promise<InvestmentAccount> => {
    return serverApi.get<InvestmentAccount>(`/investment-accounts/${id}`);
  },

  // Get investment accounts for a specific family member
  getByFamilyMember: async (familyMemberId: string): Promise<InvestmentAccount[]> => {
    return serverApi.get<InvestmentAccount[]>(`/investment-accounts/family-member/${familyMemberId}`);
  },

  // Create a new investment account
  create: async (data: Omit<InvestmentAccount, 'id'>): Promise<InvestmentAccount> => {
    return serverApi.post<InvestmentAccount>('/investment-accounts', data);
  },

  // Update an existing investment account
  update: async (id: string, data: Partial<InvestmentAccount>): Promise<InvestmentAccount> => {
    return serverApi.put<InvestmentAccount>(`/investment-accounts/${id}`, data);
  },

  // Delete an investment account
  delete: async (id: string): Promise<void> => {
    return serverApi.delete<void>(`/investment-accounts/${id}`);
  },
}; 