import apiClient from './client';

// Define TypeScript interfaces for training session based on backend schema
export interface TrainingSession {
  id: string;
  title: string;
  description?: string;
  session_date: string; // ISO date string
  location?: string;
  trainer_ids: string[];
  topic_ids: string[];
  conducted_by: string[];
  covers: string[];
  participated_in: string[];
}

// Training API functions
export const trainingApi = {
  // Get all training sessions with optional filters
  getTrainingSessions: async (
    skip: number = 0,
    limit: number = 100,
    filters?: Record<string, any>
  ) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await apiClient.get(`/training?${params.toString()}`);
    return response.data;
  },

  // Get single training session by ID
  getTrainingSessionById: async (sessionId: string) => {
    const response = await apiClient.get(`/training/${sessionId}`);
    return response.data;
  },

  // Create new training session
  createTrainingSession: async (trainingData: Partial<TrainingSession>) => {
    const response = await apiClient.post('/training', trainingData);
    return response.data;
  },

  // Update existing training session
  updateTrainingSession: async (
    sessionId: string,
    trainingData: Partial<TrainingSession>
  ) => {
    const response = await apiClient.put(`/training/${sessionId}`, trainingData);
    return response.data;
  },

  // Delete training session
  deleteTrainingSession: async (sessionId: string) => {
    await apiClient.delete(`/training/${sessionId}`);
  },
};