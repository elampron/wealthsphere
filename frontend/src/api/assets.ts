import { api } from './api';

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

export const assetApi = {
  /**
   * Get all assets
   */
  getAll: async (): Promise<Asset[]> => {
    const assets = await api.get<any[]>('/assets');
    console.log("Raw assets from API:", assets);
    return assets.map(normalizeAsset);
  },

  /**
   * Get a single asset by ID
   */
  getById: async (id: number): Promise<Asset> => {
    const asset = await api.get<any>(`/assets/${id}`);
    return normalizeAsset(asset);
  },

  /**
   * Create a new asset
   */
  create: async (data: AssetCreate): Promise<Asset> => {
    return api.post('/assets', data);
  },

  /**
   * Update an existing asset
   */
  update: async (id: number, data: AssetUpdate): Promise<Asset> => {
    return api.put(`/assets/${id}`, data);
  },

  /**
   * Delete an asset
   */
  delete: async (id: number): Promise<void> => {
    return api.delete(`/assets/${id}`);
  }
}; 