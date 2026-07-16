import { NextResponse } from "next/server";

import { listInventoryItems, toCsv } from "@/lib/firestore";

export async function POST() {
  try {
    const inventory = await listInventoryItems({ page: 1, pageSize: 5000 });
    const content = toCsv(
      inventory.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        currentStock: item.currentStock,
        minStockLevel: item.minStockLevel,
        maxStockLevel: item.maxStockLevel,
        location: item.location,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
      })),
      ["name", "sku", "currentStock", "minStockLevel", "maxStockLevel", "location", "costPrice", "sellingPrice"],
    );

    return NextResponse.json({
      fileName: `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`,
      content,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to export inventory." },
      { status: 500 },
    );
  }
}
