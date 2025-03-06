import { api } from './api';

export interface InsurancePolicy {
  id: number;
  name: string;
  policy_number: string | null;
  insurance_type: InsuranceTypeEnum;
  provider: string | null;
  coverage_amount: number;
  premium_amount: number;
  premium_payment_frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  is_term: boolean;
  is_taxable_benefit: boolean;
  notes: string | null;
  family_member_id: number;
}

export enum InsuranceTypeEnum {
  LIFE = "LIFE",
  DISABILITY = "DISABILITY",
  CRITICAL_ILLNESS = "CRITICAL_ILLNESS",
  LONG_TERM_CARE = "LONG_TERM_CARE",
  HEALTH = "HEALTH",
  HOME = "HOME",
  AUTO = "AUTO",
  OTHER = "OTHER"
}

export interface InsurancePolicyCreate {
  name: string;
  policy_number?: string | null;
  insurance_type: InsuranceTypeEnum;
  provider?: string | null;
  coverage_amount?: number;
  premium_amount?: number;
  premium_payment_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_term?: boolean;
  is_taxable_benefit?: boolean;
  notes?: string | null;
  family_member_id: number;
}

export interface InsurancePolicyUpdate {
  name?: string;
  policy_number?: string | null;
  insurance_type?: InsuranceTypeEnum;
  provider?: string | null;
  coverage_amount?: number;
  premium_amount?: number;
  premium_payment_frequency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_term?: boolean;
  is_taxable_benefit?: boolean;
  notes?: string | null;
  family_member_id?: number;
}

export const insuranceApi = {
  /**
   * Get all insurance policies, optionally filtered by family member and type
   */
  getAll: async (familyMemberId?: number, insuranceType?: string): Promise<InsurancePolicy[]> => {
    let params = '';
    
    if (familyMemberId || insuranceType) {
      params = '?';
      if (familyMemberId) {
        params += `family_member_id=${familyMemberId}`;
      }
      if (insuranceType) {
        params += familyMemberId ? `&insurance_type=${insuranceType}` : `insurance_type=${insuranceType}`;
      }
    }
    
    return api.get(`/insurance-policies${params}`);
  },

  /**
   * Get a single insurance policy by ID
   */
  getById: async (id: number): Promise<InsurancePolicy> => {
    return api.get(`/insurance-policies/${id}`);
  },

  /**
   * Create a new insurance policy
   */
  create: async (data: InsurancePolicyCreate): Promise<InsurancePolicy> => {
    return api.post('/insurance-policies', data);
  },

  /**
   * Update an existing insurance policy
   */
  update: async (id: number, data: InsurancePolicyUpdate): Promise<InsurancePolicy> => {
    return api.put(`/insurance-policies/${id}`, data);
  },

  /**
   * Delete an insurance policy
   */
  delete: async (id: number): Promise<void> => {
    return api.delete(`/insurance-policies/${id}`);
  }
}; 