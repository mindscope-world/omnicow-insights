import apiClient from './client';

// Define TypeScript interfaces for adoption based on backend schema
export interface Adoption {
  id: string; // uid from the backend
  farmer_id: string;
  input_product_name: string;
  date_adopted: string; // ISO date string
}

// Adoption API functions
export const adoptionApi = {
  // Get all adoptions with optional filters
  getAdoptions: async (
    skip: number = 0,
    limit: number = 100,
    filters?: Record<string, any>
  ) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await apiClient.get(`/adoption?${params.toString()}`);
    return response.data;
  },

  // Get single adoption by ID
  getAdoptionById: async (adoptionId: string) => {
    const response = await apiClient.get(`/adoption/${adoptionId}`);
    return response.data;
  },

  // Create new adoption
  createAdoption: async (adoptionData: {
    farmer_id: string;
    input_product_name: string;
  }) => {
    const response = await apiClient.post('/adoption', adoptionData);
    return response.data;
  },

  // Update adoption (if needed)
  updateAdoption: async (
    adoptionId: string,
    adoptionData: Partial<Adoption>
  ) => {
    const response = await apiClient.put(`/adoption/${adoptionId}`, adoptionData);
    return response.data;
  },

  // Delete adoption
  deleteAdoption: async (adoptionId: string) => {
    await apiClient.delete(`/adoption/${adoptionId}`);
  },
};