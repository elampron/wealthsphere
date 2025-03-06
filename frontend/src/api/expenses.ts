import { api } from './api';

export enum ExpenseTypeEnum {
  HOUSING = "HOUSING",
  TRANSPORTATION = "TRANSPORTATION",
  FOOD = "FOOD",
  UTILITIES = "UTILITIES",
  HEALTHCARE = "HEALTHCARE",
  INSURANCE = "INSURANCE",
  ENTERTAINMENT = "ENTERTAINMENT",
  TRAVEL = "TRAVEL",
  EDUCATION = "EDUCATION",
  SPECIAL = "SPECIAL",
  OTHER = "OTHER"
}

// Backend model
export interface BackendExpense {
  id: number;
  name: string;
  amount: number;
  expense_type: string;
  category?: string;
  family_member_id: number | null;
  start_year: number;
  end_year?: number | null;
  expected_growth_rate?: number;
  is_tax_deductible?: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend model
export interface Expense {
  id: number;
  name: string;
  amount: number;
  type: string;
  category: string;
  year: number;
  family_member_id: number | null;
  family_member_name?: string | null;
  end_year?: number | null;
  expected_growth_rate?: number;
  is_tax_deductible?: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Transform backend model to frontend model
function transformExpense(backendExpense: BackendExpense): Expense {
  return {
    id: backendExpense.id,
    name: backendExpense.name,
    amount: backendExpense.amount,
    type: backendExpense.expense_type,
    category: backendExpense.category || '',
    year: backendExpense.start_year,
    family_member_id: backendExpense.family_member_id,
    end_year: backendExpense.end_year,
    expected_growth_rate: backendExpense.expected_growth_rate,
    is_tax_deductible: backendExpense.is_tax_deductible,
    notes: backendExpense.notes,
    created_at: backendExpense.created_at,
    updated_at: backendExpense.updated_at
  };
}

export interface ExpenseCreate {
  name: string;
  expense_type: string;
  amount: number;
  category: string;
  family_member_id?: number | null;
  start_year: number;
  end_year?: number | null;
  expected_growth_rate?: number;
  is_tax_deductible?: boolean;
  notes?: string | null;
}

export interface ExpenseUpdate {
  name?: string;
  expense_type?: string;
  amount?: number;
  category?: string;
  family_member_id?: number | null;
  start_year?: number;
  end_year?: number | null;
  expected_growth_rate?: number;
  is_tax_deductible?: boolean;
  notes?: string | null;
}

export interface ExpenseCopy {
  years: number[];
}

export const expenseApi = {
  /**
   * Get all expenses with optional filters
   */
  getAll: async (
    familyMemberId?: number,
    expenseType?: string,
    year?: number
  ): Promise<Expense[]> => {
    let url = '/expenses';
    const params = [];
    
    if (familyMemberId) params.push(`family_member_id=${familyMemberId}`);
    if (expenseType) params.push(`expense_type=${expenseType}`);
    if (year) params.push(`year=${year}`);
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    const response = await api.get<BackendExpense[]>(url);
    // Transform backend model to frontend model
    return response.map(transformExpense);
  },

  /**
   * Get a single expense by ID
   */
  getById: async (id: number): Promise<Expense> => {
    const response = await api.get<BackendExpense>(`/expenses/${id}`);
    return transformExpense(response);
  },

  /**
   * Create a new expense
   */
  create: async (data: ExpenseCreate): Promise<Expense> => {
    const response = await api.post<BackendExpense>('/expenses', data);
    return transformExpense(response);
  },

  /**
   * Update an existing expense
   */
  update: async (id: number, data: ExpenseUpdate): Promise<Expense> => {
    const response = await api.put<BackendExpense>(`/expenses/${id}`, data);
    return transformExpense(response);
  },

  /**
   * Delete an expense
   */
  delete: async (id: number): Promise<void> => {
    return api.delete(`/expenses/${id}`);
  },

  /**
   * Copy an expense to multiple years
   */
  copyToYears: async (id: number, data: ExpenseCopy): Promise<Expense[]> => {
    const response = await api.post<BackendExpense[]>(`/expenses/${id}/copy`, data);
    return response.map(transformExpense);
  }
}; 