export type Role = 'ROLE_USER' | 'ROLE_EMPLOYEE' | 'ROLE_ADMIN';

export type DishStatus = 'ACTIVE' | 'HIDDEN';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: Record<string, string>;
  timestamp: string;
}

export interface UserDto {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  user: UserDto;
}

export interface CategoryDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  displayOrder: number;
  active: boolean;
}

export interface IngredientDto {
  id: number;
  code: string;
  name: string;
  unit: string;
  minStockThreshold: number;
  currentStock: number;
  avgUnitCost: number;
  lowStock: boolean;
  active: boolean;
  usedInRecipe?: boolean;
}

export interface RecipeItemDto {
  id: number;
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  quantity: number;
  note?: string | null;
}

export interface DishSummaryDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  status: DishStatus;
  categoryId: number;
  categoryName: string;
  ingredientCount: number;
}

export interface DishDetailDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  status: DishStatus;
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  recipeItems: RecipeItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeItemRequestPayload {
  ingredientId: number;
  quantity: number;
  note?: string;
}

export interface DishUpsertPayload {
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  categoryId: number;
  status: DishStatus;
  recipeItems?: RecipeItemRequestPayload[];
}

export interface IngredientUpsertPayload {
  code: string;
  name: string;
  unit: string;
  minStockThreshold: number;
  active?: boolean;
}

export interface CategoryCreatePayload {
  code: string;
  name: string;
  description?: string;
  displayOrder?: number;
  active?: boolean;
}
