import { apiClient } from './apiClient';
import type {
  AiMenuRecommendationRequestPayload,
  AiMenuRecommendationResponse,
} from './types';

export const aiMenuService = {
  async getRecommendations(
    payload: AiMenuRecommendationRequestPayload,
    signal?: AbortSignal
  ): Promise<AiMenuRecommendationResponse> {
    const response = await apiClient.post<{ data: AiMenuRecommendationResponse }>(
      '/api/v1/ai/menu/recommendations',
      payload,
      { signal }
    );
    return response.data.data;
  },
};
