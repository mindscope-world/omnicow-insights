import apiClient from './client';

// Define TypeScript interfaces for analytics data based on analytics endpoints
export interface AdoptionRate {
  ward: string;
  adoption_rate_percentage: number;
  total_farmers: number;
  adopted_farmers: number;
  period: string; // e.g., "2024-Q1"
}

export interface WardPerformance {
  ward: string;
  total_farmers: number;
  trained_farmers: number;
  adopted_farmers: number;
  adoption_rate_percentage: number;
  avg_trainings_per_farmer: number;
}

export interface TrendsData {
  adoption_trend: Array<{ month: string; rate: number }>;
  training_trend: Array<{ month: string; count: number }>;
  visit_trend: Array<{ month: string; count: number }>;
}

// Analytics API functions (excluding trainer-effectiveness which is covered by agent service)
export const analyticsApi = {
  // Get adoption rates by ward
  getAdoptionRates: async (): Promise<AdoptionRate[]> => {
    const response = await apiClient.get(`/analytics/adoption-rates/`);
    return response;
  },

  // Get ward performance metrics
  getWardPerformance: async (): Promise<WardPerformance[]> => {
    const response = await apiClient.get(`/analytics/ward-performance/`);
    return response;
  },

  // Get trends data
  getTrends: async (): Promise<TrendsData> => {
    const response = await apiClient.get(`/analytics/trends/`);
    return response;
  },
};