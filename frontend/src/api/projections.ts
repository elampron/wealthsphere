import { api } from './api';

export interface ProjectionParameters {
  start_year: number;
  end_year: number;
  inflation_rate?: number;
  province?: string;
}

export interface CashFlowProjection {
  total_income: number;
  total_expenses: number;
  net_cash_flow: number;
  withdrawal_strategy?: WithdrawalStrategy;
  death_benefits: DeathBenefit[];
}

export interface WithdrawalStrategy {
  shortfall: number;
  withdrawals: Record<string, number>;
  remaining_balance: Record<string, number>;
  unfunded_amount?: number;
}

export interface WithdrawalStrategyResult {
  shortfall: number;
  unfunded_amount: number;
  account_details: Record<string, AccountWithdrawal>;
}

export interface AccountWithdrawal {
  account_name: string;
  account_type: string;
  family_member_name: string;
  start_value: number;
  withdrawal: number;
  end_value: number;
}

export interface DeathBenefit {
  family_member_id: number;
  family_member_name: string;
  benefit_amount: number;
}

export const projectionsApi = {
  /**
   * Generate net worth projections
   */
  getNetWorthProjections: async (
    params: ProjectionParameters
  ): Promise<Record<string, Record<string, number>>> => {
    return api.post('/projections/net-worth', params);
  },

  /**
   * Generate cash flow projections
   */
  getCashFlowProjections: async (
    params: ProjectionParameters
  ): Promise<Record<string, CashFlowProjection>> => {
    return api.post('/projections/cash-flow', params);
  },

  /**
   * Generate detailed withdrawal strategy projections
   */
  getDetailedWithdrawalProjections: async (
    params: ProjectionParameters
  ): Promise<Record<string, WithdrawalStrategyResult>> => {
    return api.post('/projections/detailed-withdrawals', params);
  }
}; 