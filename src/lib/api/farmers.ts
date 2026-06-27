import apiClient from './client';
import type { Farmer, Priority } from '@/lib/omnicow/data';

// ---------------------------------------------------------------------------
// Adapter: maps backend FarmerResponse → frontend Farmer shape
// ---------------------------------------------------------------------------

/** Derive the priority tier from an engagement score (0–100 int from backend). */
function derivePriority(score7d: number): Priority {
  const normalised = score7d / 100; // backend stores as 0–100 int
  if (normalised >= 0.3 && normalised <= 0.85) return 'urgent';
  if (normalised < 0.3) return 'watch';
  return 'low';
}

export function adaptFarmer(raw: any): Farmer {
  const day7  = (raw.day7_score  ?? raw.engagement_score_7d  ?? 0) / (raw.day7_score  !== undefined ? 1 : 100);
  const day90 = (raw.day90_score ?? raw.engagement_score_30d ?? 0) / (raw.day90_score !== undefined ? 1 : 100);
  const day120= (raw.day120_score?? raw.engagement_score_90d ?? 0) / (raw.day120_score!== undefined ? 1 : 100);

  const priority: Priority = raw.priority ?? derivePriority(raw.engagement_score_7d ?? 0);

  return {
    id:           raw.farmer_id   ?? raw.id ?? '',
    ward:         raw.ward        ?? raw.located_in ?? '',
    subCounty:    raw.sub_county  ?? raw.subCounty  ?? '',
    county:       raw.county      ?? '',
    cluster:      raw.cluster     ?? 0,
    priority,
    day7,
    day90,
    day120,
    window: {
      kind:          raw.window_kind    ?? 'Day 7',
      daysRemaining: raw.days_remaining ?? 0,
    },
    shap:              raw.shap_explanation ?? raw.shap ?? '',
    gender:            raw.gender       ?? 'Male',
    age:               raw.age          ?? 0,
    ageGroup:          raw.age_bracket  ?? raw.ageGroup ?? '',
    registration:      raw.registration_method ?? raw.registration ?? 'mobile_app',
    cooperative:       raw.cooperative_name    ?? raw.cooperative  ?? 'Independent',
    lastContact:       raw.last_contact        ?? raw.lastContact  ?? '',
    firstTraining:     raw.first_training_date ?? raw.firstTraining ?? '',
    trainers:          raw.trainers            ?? raw.trained_by   ?? [],
    topics:            raw.topics              ?? raw.participated_in ?? [],
    history:           raw.intervention_history ?? raw.history ?? [],
    pageRank:          raw.page_rank           ?? raw.pageRank          ?? 0,
    peerAdoptionRatio: raw.peer_adoption_ratio ?? raw.peerAdoptionRatio ?? 0,
    influence:         raw.influence_score     ?? raw.influence         ?? 0,
    communitySize:     raw.community_size      ?? raw.communitySize     ?? 0,
    momentum:          raw.momentum            ?? 'rising',
    adopted:           raw.has_adopted         ?? raw.adopted           ?? false,
    lat:               raw.latitude            ?? raw.lat               ?? 0,
    lng:               raw.longitude           ?? raw.lng               ?? 0,
    shapFeatures:      raw.shap_features       ?? raw.shapFeatures      ?? [],
  };
}

// ---------------------------------------------------------------------------
// Farmer API functions
// ---------------------------------------------------------------------------
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
    const response = await apiClient.get(`/farmers/?${params.toString()}`);
    return (Array.isArray(response) ? response : []).map(adaptFarmer);
  },

  // Get single farmer by ID
  getFarmerById: async (farmerId: string): Promise<Farmer> => {
    const response = await apiClient.get(`/farmers/${farmerId}/`);
    return adaptFarmer(response);
  },

  // Create new farmer
  createFarmer: async (farmerData: Partial<Farmer>): Promise<Farmer> => {
    const response = await apiClient.post(`/farmers/`, farmerData);
    return adaptFarmer(response);
  },

  // Update existing farmer
  updateFarmer: async (
    farmerId: string,
    farmerData: Partial<Farmer>
  ): Promise<Farmer> => {
    const response = await apiClient.put(`/farmers/${farmerId}/`, farmerData);
    return adaptFarmer(response);
  },

  // Delete farmer
  deleteFarmer: async (farmerId: string) => {
    await apiClient.delete(`/farmers/${farmerId}/`);
  },

  // Get farmer adoption history
  getFarmerAdoptionHistory: async (
    farmerId: string
  ): Promise<any[]> => {
    const response = await apiClient.get(`/farmers/${farmerId}/adoption-history/`);
    return Array.isArray(response) ? response : [];
  },
};