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
      {
        signal,
        timeout: 35000, // Generous client timeout to allow backend AI fallback to complete cleanly
      }
    );
    return response.data.data;
  },
};
