import apiClient from './client';

// Define TypeScript interface for demand forecast data based on demand-forecast endpoint
export interface DemandForecastResponse {
  ward: string;
  forecast_period: string; // e.g., "2024-Q1"
  predicted_demand: number; // Expected quantity of inputs needed
  confidence_interval: {
    lower: number;
    upper: number;
  };
  factors: Array<{
    factor_name: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  generated_at: string; // ISO date string
}

// Demand Forecast API functions
export const demandForecastApi = {
  // Get demand forecast for a specific ward
  getDemandForecast: async (ward: string): Promise<DemandForecastResponse> => {
    const response = await apiClient.get(`/demand-forecast/${ward}/`);
    return response;
  },
};