import { apiClient } from './apiClient';
import type {
  ApiResponse,
  ReservationStatus,
  StockAvailabilityDto,
  StockReservationDto,
} from './types';
import type { PageResponse } from './menuService';

export const reservationService = {
  async getReservations(params?: {
    status?: ReservationStatus;
    page?: number;
    size?: number;
  }): Promise<PageResponse<StockReservationDto>> {
    const res = await apiClient.get<ApiResponse<PageResponse<StockReservationDto>>>(
      '/admin/inventory/reservations',
      { params }
    );
    return res.data.data;
  },

  async getAvailability(): Promise<StockAvailabilityDto[]> {
    const res = await apiClient.get<ApiResponse<StockAvailabilityDto[]>>(
      '/admin/inventory/availability'
    );
    return res.data.data;
  },
};
