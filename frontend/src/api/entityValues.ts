import { api } from './api';
import { EntityValue } from '@/types/finance';

export const entityValuesApi = {
  getEntityValues: async (scenarioId: number): Promise<EntityValue[]> => {
    const response = await api.get<{ data: EntityValue[] }>(`/entity-values?scenario_id=${scenarioId}`);
    return response.data;
  },

  getEntityValue: async (id: number): Promise<EntityValue> => {
    const response = await api.get<{ data: EntityValue }>(`/entity-values/${id}`);
    return response.data;
  },

  createEntityValue: async (data: {
    scenario_id: number;
    entity_type: string;
    entity_id: number;
    value: number;
    recorded_at?: string;
  }): Promise<EntityValue> => {
    const response = await api.post<{ data: EntityValue }>('/entity-values', data);
    return response.data;
  },

  updateEntityValue: async (id: number, data: {
    value: number;
    recorded_at?: string;
  }): Promise<EntityValue> => {
    const response = await api.put<{ data: EntityValue }>(`/entity-values/${id}`, data);
    return response.data;
  },

  deleteEntityValue: async (id: number): Promise<void> => {
    await api.delete(`/entity-values/${id}`);
  }
}; 