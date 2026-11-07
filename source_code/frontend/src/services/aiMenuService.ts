import { apiClient } from './apiClient';
import type {
  AiMenuRecommendationRequestPayload,
  AiMenuRecommendationResponse,
  ApiResponse,
} from './types';

export const aiMenuService = {
  async getRecommendations(
    payload: AiMenuRecommendationRequestPayload,
    signal?: AbortSignal
  ): Promise<AiMenuRecommendationResponse> {
    const response = await apiClient.post<ApiResponse<AiMenuRecommendationResponse>>(
      '/ai/menu/recommendations',
      payload,
      { signal }
    );
    return response.data.data;
  },
};
