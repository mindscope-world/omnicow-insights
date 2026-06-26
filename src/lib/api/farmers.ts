import apiClient from './client';
import type { Farmer } from '@/lib/omnicow/data';

// Farmer API functions
export const farmerApi = {
  // Get all farmers with optional filters
  getFarmers: async (
    skip: number = 0,
    limit: number = 100,
    filters?: Record<string, any>
  ): Promise<Farmer[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await apiClient.get(`/farmers?${params.toString()}`);
    return response.data;
  },

  // Get single farmer by ID
  getFarmerById: async (farmerId: string): Promise<Farmer> => {
    const response = await apiClient.get(`/farmers/${farmerId}`);
    return response.data;
  },

  // Create new farmer
  createFarmer: async (farmerData: Partial<Farmer>): Promise<Farmer> => {
    const response = await apiClient.post('/farmers', farmerData);
    return response.data;
  },

  // Update existing farmer
  updateFarmer: async (farmerId: string, farmerData: Partial<Farmer>): Promise<Farmer> => {
    const response = await apiClient.put(`/farmers/${farmerId}`, farmerData);
    return response.data;
  },

  // Delete/deactivate farmer
  deleteFarmer: async (farmerId: string): Promise<void> => {
    await apiClient.delete(`/farmers/${farmerId}`);
  },

  // Get farmer adoption history
  getFarmerAdoptionHistory: async (farmerId: string): Promise<any[]> => {
    const response = await apiClient.get(`/farmers/${farmerId}/adoption-history`);
    return response.data;
  },
};