import { api } from './api';
import { Asset, EntityValue } from '@/types/finance';

export enum AssetTypeEnum {
  PRIMARY_RESIDENCE = "PRIMARY_RESIDENCE",
  SECONDARY_PROPERTY = "SECONDARY_PROPERTY",
  BUSINESS = "BUSINESS",
  VEHICLE = "VEHICLE",
  OTHER = "OTHER"
}

export interface Asset {
  id: number;
  name: string;
  asset_type: string;
  current_value: number;
  purchase_value?: number | null;
  purchase_date?: string | null;
  expected_annual_appreciation: number;
  is_primary_residence: boolean;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssetCreate {
  name: string;
  asset_type: string;
  current_value: number;
  purchase_value?: number | null;
  purchase_date?: string | null;
  expected_annual_appreciation: number;
  is_primary_residence: boolean;
  notes?: string | null;
}

export interface AssetUpdate {
  name?: string;
  asset_type?: string;
  current_value?: number;
  purchase_value?: number | null;
  purchase_date?: string | null;
  expected_annual_appreciation?: number;
  is_primary_residence?: boolean;
  notes?: string | null;
}

// Helper function to ensure consistent asset structure
function normalizeAsset(asset: any): Asset {
  return {
    id: asset.id,
    name: asset.name,
    asset_type: asset.asset_type,
    current_value: typeof asset.current_value === 'number' ? asset.current_value : 0,
    purchase_value: asset.purchase_value || null,
    purchase_date: asset.purchase_date || null,
    expected_annual_appreciation: typeof asset.expected_annual_appreciation === 'number' ? asset.expected_annual_appreciation : 0,
    is_primary_residence: Boolean(asset.is_primary_residence),
    notes: asset.notes || null,
    created_at: asset.created_at,
    updated_at: asset.updated_at
  };
}

interface CreateAssetData {
  name: string;
  asset_type: string;
  initial_value?: number;
  expected_return_rate: number;
  notes?: string;
  family_member_id: number;
}

interface UpdateAssetData {
  name?: string;
  asset_type?: string;
  expected_return_rate?: number;
  notes?: string;
  family_member_id?: number;
}

export const assetsApi = {
  getAssets: async (): Promise<Asset[]> => {
    const response = await api.get<{ data: Asset[] }>('/assets');
    return response.data;
  },

  getAsset: async (id: number): Promise<Asset> => {
    const response = await api.get<{ data: Asset }>(`/assets/${id}`);
    return response.data;
  },

  createAsset: async (data: CreateAssetData): Promise<Asset> => {
    const response = await api.post<{ data: Asset }>('/assets', data);
    return response.data;
  },

  updateAsset: async (id: number, data: UpdateAssetData): Promise<Asset> => {
    const response = await api.put<{ data: Asset }>(`/assets/${id}`, data);
    return response.data;
  },

  deleteAsset: async (id: number): Promise<void> => {
    await api.delete(`/assets/${id}`);
  },

  setValue: async (id: number, value: number): Promise<EntityValue> => {
    const response = await api.post<{ data: EntityValue }>(`/assets/${id}/value`, { value });
    return response.data;
  }
}; 