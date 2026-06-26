import apiClient from './client';

// Define TypeScript interface for agent performance data based on analytics/trainer-effectiveness endpoint
export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  trainings_conducted: number;
  total_attendees: number;
  unique_attendees: number;
  average_attendance_per_training: number;
}

// Agent API functions
export const agentApi = {
  // Get agent performance data from analytics endpoint
  getAgentPerformance: async () => {
    const response = await apiClient.get('/analytics/trainer-effectiveness');
    // Map the response to match our expected interface
    return response.data.map((trainer: any) => ({
      agent_id: trainer.trainer_id,
      agent_name: trainer.trainer_name,
      trainings_conducted: trainer.trainings_conducted,
      total_attendees: trainer.total_attendees,
      unique_attendees: trainer.unique_attendees,
      average_attendance_per_training: trainer.average_attendance_per_training,
    }));
  },
};