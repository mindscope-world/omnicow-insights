import apiClient from './client';

// Define TypeScript interfaces for visit log data based on visit-log endpoints
export interface VisitLogResponse {
  id: string; // ISO date string
  updated_at: string; // ISO date string
}

// Inputs for visit history API functions
export interface VisitHistoryParams {
  id: string;
  farmer_id: string;
  agent_id: string;
  visit_date: string; // ISO date string
  notes: string | null;
  created_at: string; // ISO date string
}

// Input Requests API functions
export const visitLogsApi = {
  // Create a new visit log entry
  createVisitLog: async (visitData: {
    farmer_id: string;
    agent_id: string;
    visit_date: string; // ISO date string
    notes?: string | null;
  }): Promise<VisitLogResponse> => {
    const response = await apiClient.post(`/visit-logs/`, visitData);
    return response.data;
  },

  // Get visit history for a farmer
  getVisitHistory: async (farmerId: string): Promise<VisitLogResponse[]> => {
    const response = await apiClient.get(`/visit-history/${farmerId}`);
    return response.data;
  },
};