export type UserRole = "ADMIN" | "MANAGER" | "VIEWER";

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT";

export type StockStatus = "OK" | "LOW" | "OUT";

export type PredictionUrgency = "critical" | "soon" | "ok";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  supplierId: string;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  costPrice: number;
  sellingPrice: number;
  location: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface StockMovement {
  id: string;
  inventoryId: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  performedBy: string;
  timestamp: string;
  changes: Record<string, unknown>;
}

export interface DashboardKpis {
  totalSkus: number;
  lowStockAlerts: number;
  totalStockValue: number;
  recentMovements: number;
}

export interface CategoryStockDatum {
  categoryId: string;
  categoryName: string;
  stock: number;
  lowStock: number;
}

export interface MovementTrendDatum {
  date: string;
  in: number;
  out: number;
  adjustments: number;
}

export interface InventoryFilters {
  search: string;
  categoryId: string;
  supplierId: string;
  stockStatus: "ALL" | StockStatus;
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ItemDetailPayload {
  item: InventoryItem;
  category?: Category;
  supplier?: Supplier;
  movements: StockMovement[];
  auditLogs: AuditLog[];
  stockHistory: MovementTrendDatum[];
}

export interface PredictionInput {
  item: InventoryItem;
  movements: StockMovement[];
  supplier?: Supplier;
}

export interface PredictionResult {
  itemId: string;
  predictedDemand7d: number;
  predictedDemand14d: number;
  predictedDemand30d: number;
  recommendedReorderQty: number;
  urgency: PredictionUrgency;
  reasoning: string;
  safetyStock: number;
  averageDailyConsumption: number;
  seasonalSpikeFactor: number;
  leadTimeDays: number;
  sparkline: number[];
}

export interface AnalyticsSnapshot {
  stockValueOverTime: Array<{ date: string; value: number }>;
  topMovedItems: Array<{ itemId: string; itemName: string; movementCount: number }>;
  deadStockItems: InventoryItem[];
  supplierPerformance: Array<{
    supplierId: string;
    supplierName: string;
    averageDeliveryQty: number;
    deliveryFrequency: number;
    lastMovementAt: string | null;
  }>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ChatContextSnapshot {
  lowStockItems: Array<Pick<InventoryItem, "id" | "name" | "sku" | "currentStock" | "minStockLevel">>;
  todaysMovementCount: number;
  totalSkuCount: number;
  totalUnitsOnHand: number;
  totalInventoryValue: number;
  recentMovements: Array<
    Pick<StockMovement, "id" | "inventoryId" | "type" | "quantity" | "timestamp" | "reason" | "newStock"> & {
      itemName: string;
      sku: string;
    }
  >;
  predictions: PredictionResult[];
  inventoryLookup: Array<
    Pick<
      InventoryItem,
      | "id"
      | "name"
      | "sku"
      | "currentStock"
      | "minStockLevel"
      | "maxStockLevel"
      | "unit"
      | "location"
      | "costPrice"
      | "sellingPrice"
      | "updatedAt"
    > & {
      stockStatus: StockStatus;
      categoryName: string;
      supplierName: string;
    }
  >;
}

export interface CustomerOrderRecord {
  id: string;
  createdTime: string;
  customerName: string;
  customerContactNumber: string;
  orderIdentifier: string;
  orderedProductDetails: string;
}

export interface ExportPayload {
  fileName: string;
  mimeType: string;
  content: string;
}

export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  initialized: boolean;
}

export interface FirestoreCollections {
  users: AppUser;
  categories: Category;
  suppliers: Supplier;
  inventory: InventoryItem;
  stockMovements: StockMovement;
  auditLogs: AuditLog;
}
