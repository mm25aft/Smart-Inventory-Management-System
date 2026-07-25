import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase";
import { getStockStatus } from "@/lib/utils";
import type {
  AnalyticsSnapshot,
  AppUser,
  AuditLog,
  Category,
  CategoryStockDatum,
  ChatContextSnapshot,
  DashboardKpis,
  InventoryFilters,
  InventoryItem,
  ItemDetailPayload,
  MovementTrendDatum,
  PaginatedResult,
  PredictionInput,
  StockMovement,
  StockMovementType,
  Supplier,
  UserRole,
} from "@/types";

type FirestoreEntity = AppUser | Category | Supplier | InventoryItem | StockMovement | AuditLog;

function isoNow() {
  return new Date().toISOString();
}

function serializeValue(value: unknown): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  if ("toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)]),
  );
}

function serializeDocument<T extends FirestoreEntity>(id: string, data: Record<string, unknown>) {
  return {
    id,
    ...(serializeValue(data) as Omit<T, "id">),
  } as T;
}

async function readCollection<T extends FirestoreEntity>(collectionName: string) {
  const snapshot = await getDocs(collection(getFirebaseDb(), collectionName));
  return snapshot.docs.map((item) => serializeDocument<T>(item.id, item.data()));
}

export async function writeAuditLog({
  action,
  entity,
  entityId,
  performedBy,
  changes,
}: Omit<AuditLog, "id" | "timestamp">) {
  await addDoc(collection(getFirebaseDb(), "auditLogs"), {
    action,
    entity,
    entityId,
    performedBy,
    timestamp: isoNow(),
    changes,
  });
}

export async function getCurrentUserProfile(uid: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), "users", uid));
  if (!snapshot.exists()) {
    return null;
  }

  return serializeDocument<AppUser>(snapshot.id, snapshot.data());
}

export async function createUserProfile(
  uid: string,
  payload: Omit<AppUser, "id" | "createdAt"> & { createdAt?: string },
) {
  await setDoc(doc(getFirebaseDb(), "users", uid), {
    ...payload,
    createdAt: payload.createdAt ?? isoNow(),
  });
}

export async function saveUserProfile(
  uid: string,
  payload: Partial<Pick<AppUser, "name" | "email" | "role" | "isActive">>,
  performedBy: string,
) {
  const refDoc = doc(getFirebaseDb(), "users", uid);
  const previous = await getCurrentUserProfile(uid);

  if (previous) {
    await updateDoc(refDoc, payload);
  } else {
    await setDoc(refDoc, {
      name: payload.name ?? "",
      email: payload.email ?? "",
      role: payload.role ?? "VIEWER",
      isActive: payload.isActive ?? true,
      createdAt: isoNow(),
    });
  }

  await writeAuditLog({
    action: previous ? "USER_UPDATED" : "USER_CREATED",
    entity: "users",
    entityId: uid,
    performedBy,
    changes: payload,
  });
}

export async function listUsers() {
  const users = await readCollection<AppUser>("users");
  return users.sort((left, right) => left.name.localeCompare(right.name));
}

export async function listCategories() {
  const categories = await readCollection<Category>("categories");
  return categories.sort((left, right) => left.name.localeCompare(right.name));
}

export async function saveCategory(
  values: Omit<Category, "id" | "createdAt">,
  performedBy: string,
  id?: string,
) {
  if (id) {
    await updateDoc(doc(getFirebaseDb(), "categories", id), values);
    await writeAuditLog({
      action: "CATEGORY_UPDATED",
      entity: "categories",
      entityId: id,
      performedBy,
      changes: values,
    });
    return id;
  }

  const refDoc = await addDoc(collection(getFirebaseDb(), "categories"), {
    ...values,
    createdAt: isoNow(),
  });
  await writeAuditLog({
    action: "CATEGORY_CREATED",
    entity: "categories",
    entityId: refDoc.id,
    performedBy,
    changes: values,
  });
  return refDoc.id;
}

export async function deleteCategory(id: string, performedBy: string) {
  await deleteDoc(doc(getFirebaseDb(), "categories", id));
  await writeAuditLog({
    action: "CATEGORY_DELETED",
    entity: "categories",
    entityId: id,
    performedBy,
    changes: {},
  });
}

export async function listSuppliers() {
  const suppliers = await readCollection<Supplier>("suppliers");
  return suppliers.sort((left, right) => left.name.localeCompare(right.name));
}

export async function saveSupplier(
  values: Omit<Supplier, "id" | "createdAt">,
  performedBy: string,
  id?: string,
) {
  if (id) {
    await updateDoc(doc(getFirebaseDb(), "suppliers", id), values);
    await writeAuditLog({
      action: "SUPPLIER_UPDATED",
      entity: "suppliers",
      entityId: id,
      performedBy,
      changes: values,
    });
    return id;
  }

  const refDoc = await addDoc(collection(getFirebaseDb(), "suppliers"), {
    ...values,
    createdAt: isoNow(),
  });
  await writeAuditLog({
    action: "SUPPLIER_CREATED",
    entity: "suppliers",
    entityId: refDoc.id,
    performedBy,
    changes: values,
  });
  return refDoc.id;
}

export async function deleteSupplier(id: string, performedBy: string) {
  await deleteDoc(doc(getFirebaseDb(), "suppliers", id));
  await writeAuditLog({
    action: "SUPPLIER_DELETED",
    entity: "suppliers",
    entityId: id,
    performedBy,
    changes: {},
  });
}

export async function uploadInventoryImage(file: File) {
  const imageRef = ref(getFirebaseStorage(), `inventory/${Date.now()}-${file.name}`);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
}

export async function listInventoryItems(filters?: Partial<InventoryFilters>): Promise<PaginatedResult<InventoryItem>> {
  const allItems = await readCollection<InventoryItem>("inventory");
  let items = [...allItems];

  if (filters?.search) {
    const search = filters.search.toLowerCase();
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search) ||
        item.location.toLowerCase().includes(search),
    );
  }

  if (filters?.categoryId) {
    items = items.filter((item) => item.categoryId === filters.categoryId);
  }

  if (filters?.supplierId) {
    items = items.filter((item) => item.supplierId === filters.supplierId);
  }

  if (filters?.stockStatus && filters.stockStatus !== "ALL") {
    items = items.filter((item) => getStockStatus(item) === filters.stockStatus);
  }

  items.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  const page = filters?.page ?? 1;
  const pageSize = filters?.pageSize ?? 10;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getInventoryItemById(id: string) {
  const snapshot = await getDoc(doc(getFirebaseDb(), "inventory", id));
  if (!snapshot.exists()) {
    return null;
  }

  return serializeDocument<InventoryItem>(snapshot.id, snapshot.data());
}

export async function saveInventoryItem(
  values: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">,
  performedBy: string,
  id?: string,
) {
  const nextValues = {
    ...values,
    updatedAt: isoNow(),
  };

  if (id) {
    await updateDoc(doc(getFirebaseDb(), "inventory", id), nextValues);
    await writeAuditLog({
      action: "INVENTORY_UPDATED",
      entity: "inventory",
      entityId: id,
      performedBy,
      changes: nextValues,
    });
    return id;
  }

  const refDoc = await addDoc(collection(getFirebaseDb(), "inventory"), {
    ...nextValues,
    createdAt: isoNow(),
  });
  await writeAuditLog({
    action: "INVENTORY_CREATED",
    entity: "inventory",
    entityId: refDoc.id,
    performedBy,
    changes: nextValues,
  });
  return refDoc.id;
}

export async function deleteInventoryItem(id: string, performedBy: string) {
  await deleteDoc(doc(getFirebaseDb(), "inventory", id));
  await writeAuditLog({
    action: "INVENTORY_DELETED",
    entity: "inventory",
    entityId: id,
    performedBy,
    changes: {},
  });
}

export async function listStockMovementsByInventoryId(inventoryId: string) {
  const movementQuery = query(
    collection(getFirebaseDb(), "stockMovements"),
    where("inventoryId", "==", inventoryId),
    orderBy("timestamp", "desc"),
  );
  const snapshot = await getDocs(movementQuery);
  return snapshot.docs.map((item) => serializeDocument<StockMovement>(item.id, item.data()));
}

export async function listRecentStockMovements(maxItems = 10) {
  const movementQuery = query(
    collection(getFirebaseDb(), "stockMovements"),
    orderBy("timestamp", "desc"),
    limit(maxItems),
  );
  const snapshot = await getDocs(movementQuery);
  return snapshot.docs.map((item) => serializeDocument<StockMovement>(item.id, item.data()));
}

export async function listAuditLogsByEntity(entity: string, entityId: string) {
  const auditQuery = query(
    collection(getFirebaseDb(), "auditLogs"),
    where("entity", "==", entity),
    where("entityId", "==", entityId),
    orderBy("timestamp", "desc"),
  );
  const snapshot = await getDocs(auditQuery);
  return snapshot.docs.map((item) => serializeDocument<AuditLog>(item.id, item.data()));
}

function getNextStock(previousStock: number, quantity: number, type: StockMovementType) {
  if (type === "IN") {
    return previousStock + quantity;
  }

  if (type === "OUT") {
    return Math.max(0, previousStock - quantity);
  }

  return quantity;
}

export async function recordStockMovement(
  inventoryId: string,
  payload: {
    type: StockMovementType;
    quantity: number;
    reason: string;
  },
  performedBy: string,
) {
  const item = await getInventoryItemById(inventoryId);
  if (!item) {
    throw new Error("Inventory item not found.");
  }

  const previousStock = item.currentStock;
  const newStock = getNextStock(previousStock, payload.quantity, payload.type);

  const movementRef = await addDoc(collection(getFirebaseDb(), "stockMovements"), {
    inventoryId,
    type: payload.type,
    quantity: payload.quantity,
    previousStock,
    newStock,
    reason: payload.reason,
    performedBy,
    timestamp: isoNow(),
  });

  await updateDoc(doc(getFirebaseDb(), "inventory", inventoryId), {
    currentStock: newStock,
    updatedAt: isoNow(),
  });

  await writeAuditLog({
    action: "STOCK_MOVEMENT_CREATED",
    entity: "stockMovements",
    entityId: movementRef.id,
    performedBy,
    changes: {
      inventoryId,
      previousStock,
      newStock,
      ...payload,
    },
  });

  return movementRef.id;
}

function groupMovementTrend(movements: StockMovement[]) {
  const map = new Map<string, MovementTrendDatum>();

  for (const movement of movements) {
    const date = movement.timestamp.slice(0, 10);
    const current = map.get(date) ?? { date, in: 0, out: 0, adjustments: 0 };

    if (movement.type === "IN") {
      current.in += movement.quantity;
    } else if (movement.type === "OUT") {
      current.out += movement.quantity;
    } else {
      current.adjustments += movement.quantity;
    }

    map.set(date, current);
  }

  return Array.from(map.values()).sort((left, right) => left.date.localeCompare(right.date));
}

export async function getInventoryItemDetail(id: string): Promise<ItemDetailPayload | null> {
  const item = await getInventoryItemById(id);
  if (!item) {
    return null;
  }

  const [categories, suppliers, movements, auditLogs] = await Promise.all([
    listCategories(),
    listSuppliers(),
    listStockMovementsByInventoryId(id),
    listAuditLogsByEntity("inventory", id),
  ]);

  return {
    item,
    category: categories.find((category) => category.id === item.categoryId),
    supplier: suppliers.find((supplier) => supplier.id === item.supplierId),
    movements,
    auditLogs,
    stockHistory: groupMovementTrend(movements),
  };
}

export async function getDashboardData() {
  const [inventory, categories, movements] = await Promise.all([
    readCollection<InventoryItem>("inventory"),
    listCategories(),
    listRecentStockMovements(200),
  ]);

  const kpis: DashboardKpis = {
    totalSkus: inventory.length,
    lowStockAlerts: inventory.filter((item) => getStockStatus(item) !== "OK").length,
    totalStockValue: inventory.reduce((sum, item) => sum + item.currentStock * item.costPrice, 0),
    recentMovements: movements.length,
  };

  const categoryStock: CategoryStockDatum[] = categories.map((category) => {
    const items = inventory.filter((item) => item.categoryId === category.id);
    return {
      categoryId: category.id,
      categoryName: category.name,
      stock: items.reduce((sum, item) => sum + item.currentStock, 0),
      lowStock: items.filter((item) => getStockStatus(item) !== "OK").length,
    };
  });

  return {
    kpis,
    categoryStock,
    movementTrend: groupMovementTrend(movements),
  };
}

export async function getPredictionInputs() {
  const [inventory, suppliers, movements] = await Promise.all([
    readCollection<InventoryItem>("inventory"),
    listSuppliers(),
    readCollection<StockMovement>("stockMovements"),
  ]);

  const last90Days = new Date();
  last90Days.setDate(last90Days.getDate() - 90);

  return inventory.map<PredictionInput>((item) => ({
    item,
    supplier: suppliers.find((supplier) => supplier.id === item.supplierId),
    movements: movements.filter(
      (movement) =>
        movement.inventoryId === item.id &&
        new Date(movement.timestamp).getTime() >= last90Days.getTime(),
    ),
  }));
}

export async function getAnalyticsData(): Promise<AnalyticsSnapshot> {
  const [inventory, suppliers, movements] = await Promise.all([
    readCollection<InventoryItem>("inventory"),
    listSuppliers(),
    readCollection<StockMovement>("stockMovements"),
  ]);

  const stockValueOverTime = groupMovementTrend(movements).map((item) => ({
    date: item.date,
    value: inventory.reduce((sum, inventoryItem) => sum + inventoryItem.currentStock * inventoryItem.costPrice, 0),
  }));

  const movementCounts = inventory.map((item) => ({
    itemId: item.id,
    itemName: item.name,
    movementCount: movements.filter((movement) => movement.inventoryId === item.id).length,
  }));

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const deadStockItems = inventory.filter((item) => {
    const latestMovement = movements
      .filter((movement) => movement.inventoryId === item.id)
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0];
    if (!latestMovement) {
      return true;
    }

    return new Date(latestMovement.timestamp).getTime() < sixtyDaysAgo.getTime();
  });

  const supplierPerformance = suppliers.map((supplier) => {
    const supplierItems = inventory.filter((item) => item.supplierId === supplier.id);
    const supplierMovements = movements.filter((movement) =>
      supplierItems.some((item) => item.id === movement.inventoryId && movement.type === "IN"),
    );

    const inbound = supplierMovements.filter((movement) => movement.type === "IN");

    return {
      supplierId: supplier.id,
      supplierName: supplier.name,
      averageDeliveryQty:
        inbound.length > 0
          ? inbound.reduce((sum, movement) => sum + movement.quantity, 0) / inbound.length
          : 0,
      deliveryFrequency: inbound.length,
      lastMovementAt: inbound.sort((left, right) => right.timestamp.localeCompare(left.timestamp))[0]?.timestamp ?? null,
    };
  });

  return {
    stockValueOverTime,
    topMovedItems: movementCounts.sort((left, right) => right.movementCount - left.movementCount).slice(0, 10),
    deadStockItems,
    supplierPerformance,
  };
}

export async function getChatContextSnapshot(): Promise<ChatContextSnapshot> {
  const [inventory, categories, suppliers, movements] = await Promise.all([
    readCollection<InventoryItem>("inventory"),
    listCategories(),
    listSuppliers(),
    listRecentStockMovements(10),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const inventoryById = new Map(inventory.map((item) => [item.id, item]));

  return {
    lowStockItems: inventory
      .filter((item) => getStockStatus(item) !== "OK")
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
      })),
    totalUnitsOnHand: inventory.reduce((sum, item) => sum + item.currentStock, 0),
    totalInventoryValue: inventory.reduce((sum, item) => sum + item.currentStock * item.costPrice, 0),
    todaysMovementCount: movements.filter((movement) => movement.timestamp.startsWith(today)).length,
    totalSkuCount: inventory.length,
    recentMovements: movements.map((movement) => ({
      ...(movement as Pick<
        StockMovement,
        "id" | "inventoryId" | "type" | "quantity" | "timestamp" | "reason" | "newStock"
      >),
      itemName: inventoryById.get(movement.inventoryId)?.name ?? "Unknown item",
      sku: inventoryById.get(movement.inventoryId)?.sku ?? "",
    })),
    predictions: [],
    inventoryLookup: inventory.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      currentStock: item.currentStock,
      minStockLevel: item.minStockLevel,
      maxStockLevel: item.maxStockLevel,
      unit: item.unit,
      location: item.location,
      costPrice: item.costPrice,
      sellingPrice: item.sellingPrice,
      updatedAt: item.updatedAt,
      stockStatus: getStockStatus(item),
      categoryName: categories.find((category) => category.id === item.categoryId)?.name ?? "Unknown category",
      supplierName: suppliers.find((supplier) => supplier.id === item.supplierId)?.name ?? "Unknown supplier",
    })),
  };
}

export function toCsv<T extends Record<string, string | number | boolean | null | undefined>>(
  rows: T[],
  headers: Array<keyof T>,
) {
  const escapeCell = (value: T[keyof T]) => {
    const cell = value == null ? "" : String(value);
    return `"${cell.replaceAll('"', '""')}"`;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(",")),
  ];

  return lines.join("\n");
}

export function roleCanWrite(role: UserRole | undefined) {
  return role === "ADMIN" || role === "MANAGER";
}

export function roleCanManageUsers(role: UserRole | undefined) {
  return role === "ADMIN";
}
