import {
  SEED_SYSTEM_UID,
  SEED_TAG,
  clearSeedData,
  commitOperations,
  createFirebaseContext,
  createRng,
  isoDaysAgo,
  pickOne,
  randomInt,
  setOperation,
} from "./firebase-seed-utils.mjs";

const ITEM_COUNT = 240;
const SEED_USERS = 12;

const categorySeeds = [
  ["Electronics", "Consumer devices, accessories, and service spares."],
  ["Office Supplies", "Stationery, paper products, and desk essentials."],
  ["Furniture", "Office chairs, desks, shelving, and fixtures."],
  ["Networking", "Routers, switches, patch panels, and cabling."],
  ["Packaging", "Boxes, labels, wrap, and shipping materials."],
  ["Cleaning", "Cleaning agents, tools, and hygiene supplies."],
  ["Safety", "PPE, warning materials, and safety equipment."],
  ["Automotive", "Vehicle parts, tools, and maintenance stock."],
  ["Food Service", "Kitchen consumables and dry storage supplies."],
  ["Medical", "First-aid items and clinic consumables."],
  ["Beverages", "Bottled drinks, syrups, and pantry liquids."],
  ["Hardware", "Fasteners, tools, and repair components."],
  ["Textiles", "Uniforms, fabrics, and soft materials."],
  ["Cold Storage", "Temperature-sensitive items and containers."],
];

const supplierSeeds = [
  "Northwind Traders",
  "Prime Source Ltd",
  "Atlas Wholesale",
  "Vertex Supply Co",
  "BlueLine Distribution",
  "Summit Industrial",
  "Orbit Imports",
  "Apex Logistics",
  "Sterling Goods",
  "Metro Merchants",
  "Harbor Trade House",
  "Nova Equipment",
  "Peak Consumables",
  "Pacific Components",
  "Crestline Vendors",
  "Urban Supply Hub",
  "Evergreen Distributors",
  "Golden Gate Sourcing",
  "Silver Oak Traders",
  "Rapid Fulfillment",
  "Zenith Warehousing",
  "Helix Partners",
  "Continental Stockists",
  "BridgePoint Supply",
];

const adjectives = [
  "Smart",
  "Heavy-Duty",
  "Compact",
  "Premium",
  "Eco",
  "Secure",
  "Portable",
  "Industrial",
  "Modular",
  "Rapid",
  "Ultra",
  "Precision",
];

const nouns = [
  "Scanner",
  "Label Roll",
  "Desk Lamp",
  "Barcode Reader",
  "Storage Bin",
  "Safety Glove",
  "Patch Cable",
  "Shelf Rack",
  "Packing Tape",
  "Inspection Kit",
  "Thermal Paper",
  "Power Adapter",
  "Seat Cushion",
  "Printer Drum",
  "Tool Set",
  "Filter Cartridge",
  "Medical Mask",
  "Work Apron",
  "Cooling Pack",
  "Meter Module",
];

const units = ["pcs", "box", "pack", "kg", "litre"];
const stockInReasons = [
  "Supplier delivery",
  "Emergency restock",
  "Purchase order receipt",
  "Warehouse replenishment",
];
const stockOutReasons = [
  "Sales order",
  "Branch transfer",
  "Production issue",
  "Damaged on dispatch",
];
const adjustmentReasons = [
  "Cycle count adjustment",
  "Quality inspection update",
  "Warehouse recount",
  "Stock reconciliation",
];

function pad(value, size = 4) {
  return String(value).padStart(size, "0");
}

function makeUserOperations() {
  const operations = [];
  const now = isoDaysAgo(180);

  operations.push(
    setOperation("users", SEED_SYSTEM_UID, {
      name: "Seed System",
      email: "seed-system@example.local",
      role: "ADMIN",
      createdAt: now,
      isActive: true,
    }),
  );

  for (let index = 1; index <= SEED_USERS; index += 1) {
    const role = index <= 2 ? "ADMIN" : index <= 6 ? "MANAGER" : "VIEWER";
    const userId = `seed-user-${pad(index, 3)}`;
    const createdAt = isoDaysAgo(220 - index * 4);

    operations.push(
      setOperation("users", userId, {
        name: `Seed ${role.toLowerCase()} ${index}`,
        email: `${userId}@example.local`,
        role,
        createdAt,
        isActive: true,
      }),
    );

    operations.push(
      setOperation("auditLogs", `seed-audit-user-${pad(index, 4)}`, {
        action: "USER_CREATED",
        entity: "users",
        entityId: userId,
        performedBy: SEED_SYSTEM_UID,
        timestamp: createdAt,
        changes: { role, seedTag: SEED_TAG },
      }),
    );
  }

  return operations;
}

function buildCatalogOperations() {
  const categories = categorySeeds.map(([name, description], index) => ({
    id: `seed-category-${pad(index + 1, 3)}`,
    name,
    description: `${description} Seed dataset: ${SEED_TAG}.`,
    createdAt: isoDaysAgo(200 - index),
  }));

  const suppliers = supplierSeeds.map((name, index) => ({
    id: `seed-supplier-${pad(index + 1, 3)}`,
    name,
    contactEmail: `contact${index + 1}@seed-supplier.local`,
    phone: `+1-555-01${pad(index + 1, 2)}`,
    address: `${100 + index} Seed Avenue, Test City, TS ${3000 + index}`,
    createdAt: isoDaysAgo(190 - index),
  }));

  const operations = [];
  let auditCounter = 2000;

  for (const category of categories) {
    operations.push(setOperation("categories", category.id, category));
    operations.push(
      setOperation("auditLogs", `seed-audit-${pad(auditCounter += 1, 5)}`, {
        action: "CATEGORY_CREATED",
        entity: "categories",
        entityId: category.id,
        performedBy: SEED_SYSTEM_UID,
        timestamp: category.createdAt,
        changes: { name: category.name, seedTag: SEED_TAG },
      }),
    );
  }

  for (const supplier of suppliers) {
    operations.push(setOperation("suppliers", supplier.id, supplier));
    operations.push(
      setOperation("auditLogs", `seed-audit-${pad(auditCounter += 1, 5)}`, {
        action: "SUPPLIER_CREATED",
        entity: "suppliers",
        entityId: supplier.id,
        performedBy: SEED_SYSTEM_UID,
        timestamp: supplier.createdAt,
        changes: { name: supplier.name, seedTag: SEED_TAG },
      }),
    );
  }

  return { categories, suppliers, operations, auditCounter };
}

function createMovement(rng, itemId, currentStock, daysAgo) {
  const roll = rng();
  let type = "OUT";

  if (roll < 0.32) {
    type = "IN";
  } else if (roll > 0.9) {
    type = "ADJUSTMENT";
  }

  if (currentStock < 18) {
    type = rng() < 0.8 ? "IN" : "ADJUSTMENT";
  }

  let quantity = 0;
  let reason = "";
  let newStock = currentStock;

  if (type === "IN") {
    quantity = randomInt(rng, 8, 70);
    newStock = currentStock + quantity;
    reason = pickOne(rng, stockInReasons);
  } else if (type === "OUT") {
    quantity = Math.min(currentStock, randomInt(rng, 2, 38));
    if (quantity === 0) {
      quantity = randomInt(rng, 6, 24);
      type = "IN";
      newStock = currentStock + quantity;
      reason = pickOne(rng, stockInReasons);
    } else {
      newStock = currentStock - quantity;
      reason = pickOne(rng, stockOutReasons);
    }
  } else {
    newStock = Math.max(0, currentStock + randomInt(rng, -18, 22));
    quantity = newStock;
    reason = pickOne(rng, adjustmentReasons);
  }

  return {
    itemId,
    type,
    quantity,
    previousStock: currentStock,
    newStock,
    reason,
    timestamp: isoDaysAgo(daysAgo, randomInt(rng, 8, 18), randomInt(rng, 0, 59)),
  };
}

function buildInventoryOperations(categories, suppliers) {
  const rng = createRng(20260614);
  const operations = [];
  const items = [];
  let movementCounter = 1;
  let auditCounter = 5000;

  for (let index = 1; index <= ITEM_COUNT; index += 1) {
    const category = categories[randomInt(rng, 0, categories.length - 1)];
    const supplier = suppliers[randomInt(rng, 0, suppliers.length - 1)];
    const name = `${pickOne(rng, adjectives)} ${pickOne(rng, nouns)} ${randomInt(rng, 10, 999)}`;
    const sku = `DUM-${category.name.slice(0, 3).toUpperCase()}-${pad(index, 5)}`;
    const unit = pickOne(rng, units);
    const createdAt = isoDaysAgo(randomInt(rng, 150, 260), randomInt(rng, 8, 16));
    const deadStock = index % 11 === 0;
    const movementTotal = deadStock ? randomInt(rng, 3, 7) : randomInt(rng, 12, 24);
    const location = `${String.fromCharCode(65 + (index % 6))}-${pad((index % 18) + 1, 2)}-R${(index % 5) + 1}`;
    const imageUrl = `https://picsum.photos/seed/${sku.toLowerCase()}/240/240`;
    let currentStock = randomInt(rng, 40, 260);
    let lastMovementTimestamp = createdAt;
    const movements = [];

    for (let movementIndex = 0; movementIndex < movementTotal; movementIndex += 1) {
      const daysAgo = deadStock
        ? randomInt(rng, 70, 150)
        : randomInt(rng, 1, 120);
      movements.push(createMovement(rng, `seed-item-${pad(index, 4)}`, currentStock, daysAgo));
      currentStock = movements[movements.length - 1].newStock;
    }

    movements.sort((left, right) => left.timestamp.localeCompare(right.timestamp));

    if (movements.length > 0) {
      currentStock = movements[movements.length - 1].newStock;
      lastMovementTimestamp = movements[movements.length - 1].timestamp;
    }

    const averageOutflow = Math.max(
      4,
      Math.round(
        movements
          .filter((movement) => movement.type === "OUT")
          .reduce((sum, movement) => sum + movement.quantity, 0) / Math.max(movements.length, 1),
      ),
    );
    const minStockLevel = randomInt(rng, averageOutflow, averageOutflow + 20);
    const maxStockLevel = minStockLevel + randomInt(rng, 40, 120);
    const costPrice = randomInt(rng, 8, 160);
    const sellingPrice = costPrice + randomInt(rng, 5, 90);
    const itemId = `seed-item-${pad(index, 4)}`;

    operations.push(
      setOperation("inventory", itemId, {
        name,
        sku,
        categoryId: category.id,
        supplierId: supplier.id,
        unit,
        currentStock,
        minStockLevel,
        maxStockLevel,
        costPrice,
        sellingPrice,
        location,
        imageUrl,
        createdAt,
        updatedAt: lastMovementTimestamp,
        createdBy: SEED_SYSTEM_UID,
      }),
    );

    operations.push(
      setOperation("auditLogs", `seed-audit-${pad(auditCounter += 1, 5)}`, {
        action: "INVENTORY_CREATED",
        entity: "inventory",
        entityId: itemId,
        performedBy: SEED_SYSTEM_UID,
        timestamp: createdAt,
        changes: { sku, currentStock, seedTag: SEED_TAG },
      }),
    );

    for (const movement of movements) {
      const movementId = `seed-movement-${pad(movementCounter += 1, 5)}`;
      operations.push(
        setOperation("stockMovements", movementId, {
          inventoryId: itemId,
          type: movement.type,
          quantity: movement.quantity,
          previousStock: movement.previousStock,
          newStock: movement.newStock,
          reason: movement.reason,
          performedBy: SEED_SYSTEM_UID,
          timestamp: movement.timestamp,
        }),
      );

      operations.push(
        setOperation("auditLogs", `seed-audit-${pad(auditCounter += 1, 5)}`, {
          action: "STOCK_MOVEMENT_CREATED",
          entity: "stockMovements",
          entityId: movementId,
          performedBy: SEED_SYSTEM_UID,
          timestamp: movement.timestamp,
          changes: {
            inventoryId: itemId,
            previousStock: movement.previousStock,
            newStock: movement.newStock,
            type: movement.type,
            quantity: movement.quantity,
            seedTag: SEED_TAG,
          },
        }),
      );
    }

    items.push({ id: itemId, sku, name, currentStock });
  }

  return { operations, items };
}

async function main() {
  const { db, projectId } = createFirebaseContext();

  console.log(`Connected to Firebase project: ${projectId}`);
  console.log("Removing any previously seeded dummy dataset...");
  const clearedCount = await clearSeedData(db);
  console.log(`Removed ${clearedCount} previously seeded documents.`);

  console.log("Generating fresh large dummy dataset...");
  const userOperations = makeUserOperations();
  const { categories, suppliers, operations: catalogOperations } = buildCatalogOperations();
  const { operations: inventoryOperations, items } = buildInventoryOperations(categories, suppliers);
  const operations = [...userOperations, ...catalogOperations, ...inventoryOperations];

  await commitOperations(db, operations);

  console.log("");
  console.log("Seed complete.");
  console.log(`Users: ${SEED_USERS + 1}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Suppliers: ${suppliers.length}`);
  console.log(`Inventory items: ${items.length}`);
  console.log(`Images: remote placeholder URLs are attached to all seeded items.`);
}

main().catch((error) => {
  console.error("Dummy seed failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
