import { api } from './api';

export interface FamilyMember {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  relationship_type: string;
  is_primary: boolean;
  expected_retirement_age?: number | null;
  expected_death_age?: number | null;
  age?: number;
  retirement_year?: number | null;
  death_year?: number;
}

export interface FamilyMemberCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  relationship_type: string;
  is_primary: boolean;
  expected_retirement_age?: number | null;
  expected_death_age?: number | null;
}

export interface FamilyMemberUpdate {
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  relationship_type?: string;
  is_primary?: boolean;
  expected_retirement_age?: number | null;
  expected_death_age?: number | null;
}

export const familyApi = {
  /**
   * Get all family members
   */
  getAll: async (): Promise<FamilyMember[]> => {
    return api.get('/family');
  },

  /**
   * Get a single family member by ID
   */
  getById: async (id: number): Promise<FamilyMember> => {
    return api.get(`/family/${id}`);
  },

  /**
   * Create a new family member
   */
  create: async (data: FamilyMemberCreate): Promise<FamilyMember> => {
    return api.post('/family', data);
  },

  /**
   * Update an existing family member
   */
  update: async (id: number, data: FamilyMemberUpdate): Promise<FamilyMember> => {
    return api.put(`/family/${id}`, data);
  },

  /**
   * Delete a family member
   */
  delete: async (id: number): Promise<void> => {
    return api.delete(`/family/${id}`);
  }
}; 