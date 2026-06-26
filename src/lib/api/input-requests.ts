import apiClient from './client';

// Define TypeScript interfaces for input request data based on input-request endpoints
export interface InputRequestResponse {
  id: string;
  farmer_id: string;
  input_product_id: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  requested_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// Input Requests API functions
export const inputRequestsApi = {
  // Create a new input request
  createInputRequest: async (inputRequestData: {
    farmer_id: string;
    input_product_id: string;
    quantity: number;
  }): Promise<InputRequestResponse> => {
    const response = await apiClient.post(`/input-requests/`, inputRequestData);
    return response.data;
  },
};