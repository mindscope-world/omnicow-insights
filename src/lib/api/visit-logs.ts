import apiClient from './client';

// Define TypeScript interfaces for visit log data based on visit-log endpoints
export interface VisitLog {
  id: string;
  farmer_id: string;
  visit_date: string; // ISO date string
  location?: string;
  notes?: string | null;
  created_by: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// Visit Logs API functions
export const visitLogsApi = {
  // Create new visit log
  createVisitLog: async (visitData: {
    farmer_id: string;
    agent_id: string;
    visit_date: string; // ISO date string
    notes?: string | null;
  }): Promise<VisitLog> => {
    const response = await apiClient.post('/visit-logs/', visitData);
    return response;
  },

  // Get visit history for a farmer
  getVisitHistory: async (farmerId: string): Promise<VisitLog[]> => {
    const response = await apiClient.get(`/visit-logs/farmer/${farmerId}/`);
    return response;
  },
};