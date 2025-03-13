import { api } from './api';

export interface Scenario {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  user_id: number;
  is_locked: boolean;
  is_default: boolean;
}

export interface ScenarioCreate {
  name: string;
  description?: string;
}

export interface ScenarioUpdate {
  name?: string;
  description?: string;
}

export const scenariosApi = {
  /**
   * Get all scenarios for the current user
   */
  getAll: async (): Promise<Scenario[]> => {
    return api.get<Scenario[]>('/scenarios/');
  },

  /**
   * Get a specific scenario by ID
   */
  getById: async (id: number): Promise<Scenario> => {
    return api.get<Scenario>(`/scenarios/${id}`);
  },

  /**
   * Create a new scenario
   */
  create: async (data: ScenarioCreate): Promise<Scenario> => {
    return api.post<Scenario>('/scenarios/', data);
  },

  /**
   * Update an existing scenario
   */
  update: async (id: number, data: ScenarioUpdate): Promise<Scenario> => {
    return api.put<Scenario>(`/scenarios/${id}`, data);
  },

  /**
   * Delete a scenario
   */
  delete: async (id: number): Promise<void> => {
    return api.delete<void>(`/scenarios/${id}`);
  }
};

// Export the getScenarios function for backward compatibility
export const getScenarios = scenariosApi.getAll;

/**
 * Get a specific scenario by ID
 */
export const getScenario = scenariosApi.getById;

/**
 * Create a new scenario
 */
export const createScenario = scenariosApi.create;

/**
 * Update an existing scenario
 */
export const updateScenario = scenariosApi.update;

/**
 * Delete a scenario
 */
export const deleteScenario = scenariosApi.delete; 