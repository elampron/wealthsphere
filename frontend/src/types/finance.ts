export enum AccountType {
  RRSP = "RRSP",
  TFSA = "TFSA",
  NON_REGISTERED = "NON_REGISTERED",
  RRIF = "RRIF",
  RESP = "RESP",
  LIRA = "LIRA",
  FHSA = "FHSA",
  CORPORATION = "CORPORATION"
}

export enum AssetType {
  PRIMARY_RESIDENCE = "PRIMARY_RESIDENCE",
  SECONDARY_PROPERTY = "SECONDARY_PROPERTY",
  BUSINESS = "BUSINESS",
  VEHICLE = "VEHICLE",
  OTHER = "OTHER"
}

export interface EntityValue {
  id: number;
  entity_type: string;
  entity_id: number;
  scenario_id: number;
  value: number;
  recorded_at: string;
  created_at: string;
}

export interface InvestmentAccount {
  id: number;
  user_id: number;
  family_member_id: number;
  name: string;
  account_type: AccountType;
  institution?: string;
  expected_return_rate: number;
  is_taxable: boolean;
  contribution_room?: number;
  expected_conversion_year?: number;
  notes?: string;
  current_value?: number;
}

export interface Asset {
  id: number;
  user_id: number;
  name: string;
  asset_type: AssetType;
  purchase_value?: number;
  purchase_date?: string;
  expected_annual_appreciation: number;
  is_primary_residence: boolean;
  notes?: string;
  current_value?: number;
}

export interface Scenario {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  is_default: boolean;
  user_id: number;
  is_locked: boolean;
} 