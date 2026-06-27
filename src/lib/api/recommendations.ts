import apiClient from './client';

// Define TypeScript interfaces for recommendation data based on recommendations endpoint
export interface AdvisoryRecommendationResponse {
  recommendation_id: string;
  farmer_id: string;
  recommendation_type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string; // ISO date string
}

export interface TrendingTopic {
  topic_id: string;
  topic: string;
  mention_count: number;
  trend_score: number;
  category: string;
}

export interface RecommendationGenerateResponse {
  recommendation_id: string;
  farmer_id: string;
  recommendations: AdvisoryRecommendationResponse[];
  generated_at: string;
}

// Recommendations API functions
export const recommendationsApi = {
  // Get recommendations for a specific farmer
  getFarmerRecommendations: async (farmerId: string): Promise<AdvisoryRecommendationResponse[]> => {
    const response = await apiClient.get(`/recommendations/farmer/${farmerId}/`);
    return response;
  },

  // Get trending topics
  getTrendingTopics: async (): Promise<TrendingTopic[]> => {
    const response = await apiClient.get(`/recommendations/trending-topics/`);
    return response;
  },

  // Generate recommendations for a farmer
  generateRecommendations: async (farmerId: string): Promise<RecommendationGenerateResponse> => {
    const response = await apiClient.post(`/recommendations/generate`, { farmer_id: farmerId });
    return response;
  },
};