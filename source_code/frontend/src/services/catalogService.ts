import { apiClient } from './apiClient';
import type {
  ApiResponse,
  CategoryCreatePayload,
  CategoryDto,
  DishDetailDto,
  DishStatus,
  DishSummaryDto,
  DishUpsertPayload,
  IngredientDto,
  IngredientUpsertPayload,
  RecipeItemRequestPayload,
} from './types';

export const catalogService = {
  // --- Public Catalog ---
  async getPublicCategories(): Promise<CategoryDto[]> {
    const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/catalog/categories');
    return res.data.data;
  },

  async getPublicDishes(params?: { categoryId?: number; keyword?: string }): Promise<DishSummaryDto[]> {
    const res = await apiClient.get<ApiResponse<DishSummaryDto[]>>('/catalog/dishes', { params });
    return res.data.data;
  },

  async getPublicDishDetail(id: number): Promise<DishDetailDto> {
    const res = await apiClient.get<ApiResponse<DishDetailDto>>(`/catalog/dishes/${id}`);
    return res.data.data;
  },

  // --- Admin Catalog & Recipe ---
  async getAdminCategories(): Promise<CategoryDto[]> {
    const res = await apiClient.get<ApiResponse<CategoryDto[]>>('/admin/catalog/categories');
    return res.data.data;
  },

  async createCategory(payload: CategoryCreatePayload): Promise<CategoryDto> {
    const res = await apiClient.post<ApiResponse<CategoryDto>>('/admin/catalog/categories', payload);
    return res.data.data;
  },

  async getAdminIngredients(): Promise<IngredientDto[]> {
    const res = await apiClient.get<ApiResponse<IngredientDto[]>>('/admin/catalog/ingredients');
    return res.data.data;
  },

  async createIngredient(payload: IngredientUpsertPayload): Promise<IngredientDto> {
    const res = await apiClient.post<ApiResponse<IngredientDto>>('/admin/catalog/ingredients', payload);
    return res.data.data;
  },

  async updateIngredient(id: number, payload: IngredientUpsertPayload): Promise<IngredientDto> {
    const res = await apiClient.put<ApiResponse<IngredientDto>>(`/admin/catalog/ingredients/${id}`, payload);
    return res.data.data;
  },

  async getAdminDishes(params?: {
    categoryId?: number;
    status?: DishStatus;
    keyword?: string;
  }): Promise<DishDetailDto[]> {
    const res = await apiClient.get<ApiResponse<DishDetailDto[]>>('/admin/catalog/dishes', { params });
    return res.data.data;
  },

  async getAdminDishDetail(id: number): Promise<DishDetailDto> {
    const res = await apiClient.get<ApiResponse<DishDetailDto>>(`/admin/catalog/dishes/${id}`);
    return res.data.data;
  },

  async createDish(payload: DishUpsertPayload): Promise<DishDetailDto> {
    const res = await apiClient.post<ApiResponse<DishDetailDto>>('/admin/catalog/dishes', payload);
    return res.data.data;
  },

  async updateDish(id: number, payload: DishUpsertPayload): Promise<DishDetailDto> {
    const res = await apiClient.put<ApiResponse<DishDetailDto>>(`/admin/catalog/dishes/${id}`, payload);
    return res.data.data;
  },

  async updateDishStatus(id: number, status: DishStatus): Promise<DishDetailDto> {
    const res = await apiClient.patch<ApiResponse<DishDetailDto>>(`/admin/catalog/dishes/${id}/status`, {
      status,
    });
    return res.data.data;
  },

  async updateDishRecipe(id: number, recipeItems: RecipeItemRequestPayload[]): Promise<DishDetailDto> {
    const res = await apiClient.put<ApiResponse<DishDetailDto>>(`/admin/catalog/dishes/${id}/recipe`, {
      recipeItems,
    });
    return res.data.data;
  },
};
