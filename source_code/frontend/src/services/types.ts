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

// ----------------- PHASE 2: INVENTORY & SUPPLIERS TYPES -----------------

export interface SupplierDto {
  id: number;
  code: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  note?: string | null;
  active: boolean;
  totalPurchasedAmount: number;
  stockReceiptsCount: number;
  totalReceiptsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierUpsertPayload {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  note?: string;
  active?: boolean;
}

export type StockReceiptStatus = 'DRAFT' | 'CONFIRMED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
export type MovementType = 'IMPORT' | 'EXPORT' | 'ADJUSTMENT';
export type ReferenceType = 'STOCK_RECEIPT' | 'STOCK_ADJUSTMENT' | 'ORDER' | 'MANUAL';

export interface StockReceiptItemDto {
  id: number;
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  note?: string | null;
  lineNo: number;
}

export interface StockReceiptDto {
  id: number;
  code: string;
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  supplierPhone: string;
  supplierAddress?: string | null;
  receiptDate: string;
  status: StockReceiptStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  note?: string | null;
  paymentNote?: string | null;
  createdByName?: string | null;
  confirmedByName?: string | null;
  confirmedAt?: string | null;
  lastPaidAt?: string | null;
  items?: StockReceiptItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface StockReceiptItemRequestPayload {
  ingredientId: number;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface StockReceiptCreatePayload {
  supplierId: number;
  receiptDate?: string;
  note?: string;
  paymentNote?: string;
  amountPaid?: number;
  confirmImmediately?: boolean;
  items: StockReceiptItemRequestPayload[];
}

export interface StockReceiptPaymentPayload {
  paymentAmount: number;
  paymentNote?: string;
}

export interface StockMovementDto {
  id: number;
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  movementType: MovementType;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  unitCost: number;
  avgCostBefore: number;
  avgCostAfter: number;
  referenceType: ReferenceType;
  referenceId?: number | null;
  referenceCode: string;
  performedByName: string;
  note?: string | null;
  createdAt: string;
}

export interface StockAdjustmentDto {
  id: number;
  code: string;
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  quantityChange: number;
  reason: string;
  createdByName: string;
  createdAt: string;
}

export interface StockAdjustmentPayload {
  ingredientId: number;
  quantityChange: number;
  reason: string;
}

export interface IngredientStockDetailDto {
  ingredient: IngredientDto;
  usedInDishes: {
    dishId: number;
    dishCode: string;
    dishName: string;
    dishStatus: string;
    quantityFormatted: string;
  }[];
  recentMovements: StockMovementDto[];
  canDelete: boolean;
  deleteBlockReason?: string | null;
}

export interface InventorySummaryDto {
  totalIngredients: number;
  lowStockCount: number;
  lowStockIngredients: IngredientDto[];
  estimatedStockValue: number;
  monthlyPurchasedAmount: number;
  totalPurchasedAmount: number;
  totalPaidToSuppliers: number;
  totalRemainingToSuppliers: number;
  recentReceipts: StockReceiptDto[];
  recentMovements: StockMovementDto[];
}

// ==========================================
// PHASE 3: MENUS, ORDERS & RESERVATIONS
// ==========================================

export type MenuStatus = 'ACTIVE' | 'HIDDEN' | 'ARCHIVED';
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PREPARING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type ReservationStatus = 'ACTIVE' | 'RELEASED' | 'FULFILLED' | 'EXPIRED';

export interface MenuItemDto {
  id: number;
  dishId: number;
  dishCode: string;
  dishName: string;
  dishImageUrl?: string | null;
  categoryName?: string;
  dishPrice: number;
  quantityPerTable: number;
  lineTotalPerTable: number;
  displayOrder: number;
}

export interface MenuDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  status: MenuStatus;
  pricePerTable: number;
  itemsCount: number;
  items: MenuItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemPayload {
  dishId: number;
  quantityPerTable: number;
  displayOrder?: number;
}

export interface CreateMenuPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  items: MenuItemPayload[];
}

export interface UpdateMenuPayload {
  name: string;
  description?: string;
  imageUrl?: string;
  items: MenuItemPayload[];
}

export interface OrderItemDto {
  id: number;
  dishId?: number;
  dishCode?: string;
  dishNameSnapshot: string;
  dishImageUrl?: string | null;
  unitPriceSnapshot: number;
  quantityPerTable: number;
  totalQuantity: number;
  lineTotal: number;
}

export interface OrderStatusHistoryDto {
  id: number;
  fromStatus?: OrderStatus;
  toStatus: OrderStatus;
  changedByName: string;
  reason?: string | null;
  createdAt: string;
}

export interface StockReservationItemDto {
  id: number;
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  quantity: number;
}

export interface StockReservationDto {
  id: number;
  orderId?: number;
  orderCode?: string;
  customerName?: string;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
  releasedAt?: string | null;
  items: StockReservationItemDto[];
}

export interface OrderDto {
  id: number;
  orderCode: string;
  userId?: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventDateTime: string;
  tableCount: number;
  note?: string | null;
  eventLocation?: string | null;
  guestCount?: number | null;
  menuId?: number | null;
  menuNameSnapshot?: string | null;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentExpiresAt?: string | null;
  secondsRemaining?: number | null;
  items: OrderItemDto[];
  reservation?: StockReservationDto | null;
  statusHistories: OrderStatusHistoryDto[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemPreviewDto {
  dishId: number;
  dishCode: string;
  dishName: string;
  dishImageUrl?: string | null;
  categoryName?: string;
  unitPrice: number;
  quantityPerTable: number;
  totalQuantity: number;
  lineTotal: number;
}

export interface IngredientDemandPreviewDto {
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  requiredQuantity: number;
  physicalStock: number;
  activeReservedStock: number;
  availableStock: number;
  sufficient: boolean;
  shortageQuantity: number;
}

export interface OrderPreviewResponseDto {
  menuId?: number | null;
  menuName?: string | null;
  tableCount: number;
  pricePerTable: number;
  totalAmount: number;
  items: OrderItemPreviewDto[];
  ingredientDemands: IngredientDemandPreviewDto[];
  canProceed: boolean;
  validationMessages: string[];
}

export interface CreateOrderItemPayload {
  dishId: number;
  quantityPerTable: number;
}

export interface CreateOrderPayload {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventDateTime: string;
  tableCount: number;
  note?: string;
  eventLocation?: string;
  guestCount?: number;
  menuId?: number;
  items: CreateOrderItemPayload[];
  idempotencyKey?: string;
}

export interface OrderPreviewPayload {
  menuId?: number;
  tableCount: number;
  items?: CreateOrderItemPayload[];
}

export interface StockAvailabilityDto {
  ingredientId: number;
  ingredientCode: string;
  ingredientName: string;
  unit: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  minStockThreshold: number;
  lowStock: boolean;
}


