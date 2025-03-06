import { api } from './api';

export interface IncomeSource {
  id: number;
  name: string;
  income_type: IncomeTypeEnum;
  amount: number;
  is_taxable: boolean;
  start_year: number;
  end_year: number | null;
  expected_growth_rate: number;
  notes: string | null;
  family_member_id: number;
}

export enum IncomeTypeEnum {
  SALARY = "SALARY",
  BUSINESS_INCOME = "BUSINESS_INCOME",
  PENSION = "PENSION",
  CPP = "CPP",
  OAS = "OAS",
  GIS = "GIS",
  DIVIDEND = "DIVIDEND",
  INTEREST = "INTEREST",
  CAPITAL_GAIN = "CAPITAL_GAIN",
  RENTAL = "RENTAL",
  OTHER = "OTHER"
}

export interface IncomeSourceCreate {
  name: string;
  income_type: IncomeTypeEnum;
  amount: number;
  is_taxable?: boolean;
  start_year: number;
  end_year?: number | null;
  expected_growth_rate?: number;
  notes?: string | null;
  family_member_id: number;
}

export interface IncomeSourceUpdate {
  name?: string;
  income_type?: IncomeTypeEnum;
  amount?: number;
  is_taxable?: boolean;
  start_year?: number;
  end_year?: number | null;
  expected_growth_rate?: number;
  notes?: string | null;
  family_member_id?: number;
}

export const incomeApi = {
  /**
   * Get all income sources, optionally filtered by family member
   */
  getAll: async (familyMemberId?: number): Promise<IncomeSource[]> => {
    const params = familyMemberId ? `?family_member_id=${familyMemberId}` : '';
    return api.get(`/income-sources${params}`);
  },

  /**
   * Get a single income source by ID
   */
  getById: async (id: number): Promise<IncomeSource> => {
    return api.get(`/income-sources/${id}`);
  },

  /**
   * Create a new income source
   */
  create: async (data: IncomeSourceCreate): Promise<IncomeSource> => {
    return api.post('/income-sources', data);
  },

  /**
   * Update an existing income source
   */
  update: async (id: number, data: IncomeSourceUpdate): Promise<IncomeSource> => {
    return api.put(`/income-sources/${id}`, data);
  },

  /**
   * Delete an income source
   */
  delete: async (id: number): Promise<void> => {
    return api.delete(`/income-sources/${id}`);
  }
}; 