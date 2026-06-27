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
    const response = await apiClient.get(`/adoptions/?${params.toString()}`);
    return response;
  },

  // Get single adoption by ID
  getAdoptionById: async (adoptionId: string) => {
    const response = await apiClient.get(`/adoptions/${adoptionId}/`);
    return response;
  },

  // Create new adoption
  createAdoption: async (adoptionData: {
    farmer_id: string;
    input_product_name: string;
  }) => {
    const response = await apiClient.post('/adoptions/', adoptionData);
    return response;
  },

  // Update adoption (if needed)
  updateAdoption: async (
    adoptionId: string,
    adoptionData: Partial<Adoption>
  ) => {
    const response = await apiClient.put(`/adoptions/${adoptionId}/`, adoptionData);
    return response;
  },

  // Delete adoption
  deleteAdoption: async (adoptionId: string) => {
    await apiClient.delete(`/adoptions/${adoptionId}/`);
  },
};