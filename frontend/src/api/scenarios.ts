import { api } from './api';
import { Scenario } from '@/types/finance';

interface CreateScenarioData {
  name: string;
  description?: string;
  is_default?: boolean;
  is_locked?: boolean;
}

interface UpdateScenarioData {
  name?: string;
  description?: string;
  is_default?: boolean;
  is_locked?: boolean;
}

export const scenariosApi = {
  /**
   * Get all scenarios for the current user
   */
  getScenarios: async (): Promise<Scenario[]> => {
    const response = await api.get<{ data: Scenario[] }>('/scenarios');
    return response.data;
  },

  /**
   * Get a specific scenario by ID
   */
  getScenario: async (id: number): Promise<Scenario> => {
    const response = await api.get<{ data: Scenario }>(`/scenarios/${id}`);
    return response.data;
  },

  /**
   * Create a new scenario
   */
  createScenario: async (data: CreateScenarioData): Promise<Scenario> => {
    const response = await api.post<{ data: Scenario }>('/scenarios', data);
    return response.data;
  },

  /**
   * Update an existing scenario
   */
  updateScenario: async (id: number, data: UpdateScenarioData): Promise<Scenario> => {
    const response = await api.put<{ data: Scenario }>(`/scenarios/${id}`, data);
    return response.data;
  },

  /**
   * Delete a scenario
   */
  deleteScenario: async (id: number): Promise<void> => {
    await api.delete(`/scenarios/${id}`);
  },

  /**
   * Get the default scenario
   */
  getDefaultScenario: async (): Promise<Scenario> => {
    const response = await api.get<{ data: Scenario }>('/scenarios/default');
    return response.data;
  }
};

// Export the getScenarios function for backward compatibility
export const getScenarios = scenariosApi.getScenarios;

/**
 * Get a specific scenario by ID
 */
export const getScenario = scenariosApi.getScenario;

/**
 * Create a new scenario
 */
export const createScenario = scenariosApi.createScenario;

/**
 * Update an existing scenario
 */
export const updateScenario = scenariosApi.updateScenario;

/**
 * Delete a scenario
 */
export const deleteScenario = scenariosApi.deleteScenario;

/**
 * Get the default scenario
 */
export const getDefaultScenario = scenariosApi.getDefaultScenario; 