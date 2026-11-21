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
  emailVerified?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  user: UserDto;
  emailVerificationRequired?: boolean;
  devVerificationCode?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface ResendVerificationPayload {
  email: string;
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
export type PaymentStatus = 'UNPAID' | 'PAYMENT_REVIEW' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
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
export type ReservationStatus = 'ACTIVE' | 'RELEASED' | 'CONSUMED' | 'FULFILLED' | 'EXPIRED';

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
  contactName?: string | null;
  contactPhone?: string | null;
  eventDateTime: string;
  tableCount: number;
  note?: string | null;
  eventLocation?: string | null;
  eventLatitude?: number | null;
  eventLongitude?: number | null;
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
  contactName?: string;
  contactPhone?: string;
  eventDateTime: string;
  tableCount: number;
  note?: string;
  eventLocation?: string;
  eventLatitude?: number;
  eventLongitude?: number;
  guestCount?: number;
  menuId?: number;
  items: CreateOrderItemPayload[];
  idempotencyKey?: string;
  expectedTotalAmount?: number;
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

// ==========================================
// PHASE 5: AI MENU RECOMMENDATIONS
// ==========================================

export type BudgetType = 'PER_TABLE' | 'TOTAL_ORDER';
export type BudgetStatus = 'WITHIN_BUDGET' | 'OVER_BUDGET' | 'NO_BUDGET_SET';
export type AvailabilityStatus = 'AVAILABLE' | 'PARTIAL_SHORTAGE' | 'OUT_OF_STOCK';

export interface AiMenuRecommendationRequestPayload {
  requestText: string;
  eventType?: string;
  tableCount: number;
  guestsPerTable: number;
  budgetAmount?: number;
  budgetType?: BudgetType;
  preferences?: string;
  excludedIngredients?: string;
}

export interface MenuSuggestionItemDto {
  dishId: number;
  dishCode: string;
  dishName: string;
  dishImageUrl?: string;
  imageUrl?: string;
  categoryName: string;
  quantityPerTable: number;
  unitPrice: number;
  lineTotal: number;
}

export interface MenuSuggestionDto {
  name: string;
  title?: string;
  description?: string;
  reason?: string;
  source?: string;
  matchScore?: number;
  items: MenuSuggestionItemDto[];
  totalPerTable: number;
  tableCount: number;
  totalOrderAmount: number;
  budgetStatus: BudgetStatus;
  availabilityStatus: AvailabilityStatus;
  validationMessages: string[];
}

export interface AiMenuRecommendationResponse {
  requestId: string;
  source: string;
  suggestions: MenuSuggestionDto[];
  message?: string;
  generatedAt: string;
}




// =============================================================================
// PHASE 6: HR, ATTENDANCE & PAYROLL TYPES
// =============================================================================

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';
export type AttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'ABSENT';
export type PayrollPeriodStatus = 'DRAFT' | 'FINALIZED' | 'CLOSED';
export type AdjustmentType = 'ALLOWANCE' | 'DEDUCTION';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export interface EmployeeDto {
  id: number;
  employeeCode: string;
  userId?: number | null;
  userEmail?: string | null;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  position: string;
  hireDate: string;
  baseSalary: number;
  status: EmployeeStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayload {
  employeeCode?: string;
  userId?: number | null;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  position: string;
  hireDate: string;
  baseSalary: number;
  note?: string | null;
}

export interface UpdateEmployeePayload {
  userId?: number | null;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  position: string;
  hireDate: string;
  baseSalary: number;
  note?: string | null;
}

export interface AttendanceDto {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  workDate: string;
  attendanceStatus: AttendanceStatus;
  workUnits: number;
  note?: string | null;
  recordedBy?: string | null;
  recordedAt?: string;
}

export interface RecordAttendancePayload {
  attendanceStatus: AttendanceStatus;
  note?: string | null;
}

export interface AttendanceItemPayload {
  employeeId: number;
  attendanceStatus: AttendanceStatus;
  note?: string | null;
}

export interface BulkAttendancePayload {
  workDate: string;
  items: AttendanceItemPayload[];
}

export interface AttendanceMonthlySummaryDto {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  position: string;
  year: number;
  month: number;
  totalDaysInMonth: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  unrecordedDays: number;
  totalWorkUnits: number;
  dailyRecords?: Record<number, { attendanceStatus: AttendanceStatus; workUnits: number; note?: string }>;
  dailyStatusMap?: Record<number, AttendanceStatus>;
  dailyNoteMap?: Record<number, string>;
}

export interface CompanyAttendanceSummaryDto {
  year: number;
  month: number;
  totalEmployees: number;
  totalCompanyWorkUnits: number;
  employeeSummaries: AttendanceMonthlySummaryDto[];
}

export interface PayrollPeriodDto {
  id: number;
  year: number;
  month: number;
  standardWorkdays: number;
  status: PayrollPeriodStatus;
  finalizedAt?: string | null;
  finalizedBy?: string | null;
  closedAt?: string | null;
  note?: string | null;
  totalEmployeesCount: number;
  totalFinalizedAmount: number;
  paidCount: number;
  unpaidCount: number;
}

export interface CreatePayrollPeriodPayload {
  year: number;
  month: number;
  standardWorkdays: number;
  note?: string | null;
}

export interface UpdatePayrollPeriodPayload {
  standardWorkdays: number;
  note?: string | null;
}

export interface PayrollAdjustmentDto {
  id: number;
  payrollPeriodId: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  adjustmentType: AdjustmentType;
  amount: number;
  name?: string;
  reason?: string;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CreatePayrollAdjustmentPayload {
  employeeId: number;
  payrollPeriodId?: number;
  adjustmentType: AdjustmentType;
  amount: number;
  name?: string;
  reason?: string;
  note?: string;
}

export interface UpdatePayrollAdjustmentPayload {
  amount: number;
  name?: string;
  reason?: string;
  note?: string;
}

export interface PayrollPreviewItemDto {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  position: string;
  baseSalary: number;
  standardWorkdays: number;
  actualWorkdays: number;
  calculatedSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  warnings: string[];
}

export interface PayrollPeriodPreviewDto {
  periodId: number;
  year: number;
  month: number;
  standardWorkdays: number;
  status: PayrollPeriodStatus;
  items: PayrollPreviewItemDto[];
  totalCalculatedSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalWarningsCount: number;
  previewHash?: string;
}

export interface PayrollDto {
  id: number;
  employeeId: number;
  payrollPeriodId: number;
  employeeCodeSnapshot: string;
  employeeNameSnapshot: string;
  baseSalarySnapshot: number;
  standardWorkdaysSnapshot: number;
  actualWorkdaysSnapshot: number;
  calculatedSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: PaymentStatus;
  finalizedAt: string;
  paymentDate?: string | null;
  paymentMethod?: PaymentMethod | null;
  paidAmount?: number | null;
  paymentNote?: string | null;
  paidBy?: string | null;
}

export interface RecordSalaryPaymentPayload {
  paymentDate?: string | null;
  paymentMethod: PaymentMethod;
  note?: string | null;
}

export interface SalaryPaymentDto {
  id: number;
  payrollId: number;
  employeeCode: string;
  employeeName: string;
  periodYear: number;
  periodMonth: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  note?: string | null;
  recordedBy?: string | null;
  recordedAt: string;
}

export interface MonthlyPayrollMetricDto {
  year: number;
  month: number;
  periodName: string;
  finalizedAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: PayrollPeriodStatus;
}

export interface PayrollSummaryDto {
  year?: number | null;
  month?: number | null;
  totalFinalizedPayrollAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
  totalCalculatedSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  activeEmployeesCount: number;
  totalRecordedWorkdays: number;
  monthlyMetrics: MonthlyPayrollMetricDto[];
}

// =========================================================================
// PHASE 7: BUSINESS REPORTING, EXPENSES & ANALYTICS TYPES
// =========================================================================

export type ExpenseCategory =
  | 'RENT'
  | 'UTILITIES'
  | 'MARKETING'
  | 'MAINTENANCE'
  | 'OFFICE_SUPPLIES'
  | 'TAX_FEE'
  | 'OTHER';

export type ExpensePaymentStatus = 'UNPAID' | 'PAID';

export interface ExpenseRequest {
  expenseCode?: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  incurredDate: string;
  paymentStatus?: ExpensePaymentStatus;
  paidAt?: string | null;
  note?: string | null;
}

export interface ExpenseResponse {
  id: number;
  expenseCode: string;
  name: string;
  category: ExpenseCategory;
  categoryName: string;
  amount: number;
  incurredDate: string;
  paymentStatus: ExpensePaymentStatus;
  paidAt?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummaryResponse {
  totalCount: number;
  totalAmount: number;
  totalPaidAmount: number;
  totalUnpaidAmount: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  secondaryValue?: number | null;
  label?: string | null;
}

export interface OrderStatusStatDto {
  status: string;
  statusLabel?: string;
  count: number;
  totalAmount: number;
}

export interface CostBreakdownDto {
  category: string;
  label: string;
  amount: number;
  percentage: number;
}

export interface DashboardAlertDto {
  severity: 'INFO' | 'WARNING' | 'DANGER';
  type: string;
  title: string;
  message: string;
  actionUrl: string;
}

export interface DashboardOverviewResponse {
  totalOrders: number;
  ordersGrowthPct?: number | null;
  paidRevenue: number;
  revenueGrowthPct?: number | null;
  materialCost: number;
  grossProfit: number;
  grossMargin: number;
  internalPayrollCost: number;
  operatingExpenses: number;
  estimatedNetProfit: number;
  netMargin: number;
  averageOrderValue: number;
  confirmedPurchasesAmount: number;
  estimatedInventoryValuation: number;
  lowStockCount: number;
  outstandingSupplierDebt: number;
  unpaidPayrollDebt: number;
  startDate: string;
  endDate: string;
}

export interface TopDishReportDto {
  dishId: number;
  dishName: string;
  dishCode: string;
  categoryName: string;
  totalPortionsSold: number;
  totalRevenue: number;
}

export interface PaidOrderReportDto {
  orderId: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  eventDateTime: string;
  paidAt: string;
  tableCount: number;
  totalAmount: number;
  materialCost: number;
  grossProfit: number;
  grossMargin: number;
}

export interface RevenueSummaryResponse {
  paidRevenue: number;
  paidOrdersCount: number;
  averageOrderValue: number;
  previousPeriodRevenue: number;
  revenueGrowthPct?: number | null;
  dailyTrends: TimeSeriesPoint[];
}

export interface InventoryReportResponse {
  totalIngredientsCount: number;
  estimatedInventoryValuation: number;
  lowStockCount: number;
  confirmedPurchasesAmount: number;
  totalConsumedCost: number;
}

export interface IngredientValuationDto {
  ingredientId: number;
  name: string;
  unit: string;
  currentStock: number;
  avgUnitCost: number;
  totalValue: number;
  minStockThreshold: number;
  lowStock: boolean;
}

export interface SupplierPurchaseDto {
  supplierId: number;
  supplierName: string;
  supplierPhone: string;
  confirmedReceiptsCount: number;
  totalPurchasedAmount: number;
  totalPaidAmount: number;
  outstandingDebt: number;
}

export interface PayrollReportResponse {
  activeEmployeesCount: number;
  finalizedPeriodsCount: number;
  totalFinalizedNetSalary: number;
  totalPaidSalary: number;
  outstandingPayrollDebt: number;
  totalAllowances: number;
  totalDeductions: number;
}

export interface MonthlyProfitBreakdownDto {
  monthKey: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  payroll: number;
  expenses: number;
  netProfit: number;
}

export interface ProfitReportResponse {
  paidRevenue: number;
  materialCost: number;
  grossProfit: number;
  grossMargin: number;
  internalPayrollCost: number;
  operatingExpenses: number;
  estimatedNetProfit: number;
  netMargin: number;
  monthlyBreakdowns: MonthlyProfitBreakdownDto[];
}

export interface CashFlowReportResponse {
  inflows: number;
  outflows: number;
  netCashFlow: number;
  supplierPayments: number;
  salaryPayments: number;
  paidOperatingExpenses: number;
  unpaidSupplierDebt: number;
  unpaidSalaryDebt: number;
  unpaidOperatingExpenses: number;
  dailyPoints: TimeSeriesPoint[];
}

