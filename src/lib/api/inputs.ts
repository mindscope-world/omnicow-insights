import apiClient from './client';

// Define TypeScript interfaces for input data based on input endpoints
export interface InputProductResponse {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unit_price: number;
  unit: string;
  is_active: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// Inputs API functions
export const inputsApi = {
  // Get all input products
  getAllInputs: async (): Promise<InputProductResponse[]> => {
    const response = await apiClient.get(`/inputs/`);
    return response;
  },

  // Get input product by ID
  getInputById: async (inputId: string): Promise<InputProductResponse> => {
    const response = await apiClient.get(`/inputs/${inputId}/`);
    return response;
  },
};