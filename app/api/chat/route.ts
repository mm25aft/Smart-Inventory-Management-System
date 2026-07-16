import { convertToModelMessages, streamText, type UIMessage } from "ai";
import Fuse from "fuse.js";

import { getAIModel } from "@/lib/claude";
import type { ChatContextSnapshot } from "@/types";

function matchInventoryItem(message: string, snapshot: ChatContextSnapshot) {
  const fuse = new Fuse(snapshot.inventoryLookup, {
    keys: ["name", "sku", "categoryName", "supplierName", "location"],
    threshold: 0.4,
  });

  return fuse.search(message)[0]?.item;
}

function buildSnapshotText(snapshot: ChatContextSnapshot | null) {
  if (!snapshot) {
    return "No live inventory snapshot was provided.";
  }

  return `Context snapshot:
- Total SKU count: ${snapshot.totalSkuCount}
- Total units on hand: ${snapshot.totalUnitsOnHand}
- Total inventory value: ${snapshot.totalInventoryValue}
- Today's movement count: ${snapshot.todaysMovementCount}
- Low stock items: ${snapshot.lowStockItems
    .map((item) => `${item.name} (${item.currentStock}/${item.minStockLevel})`)
    .join(", ") || "none"}
- Recent movements: ${snapshot.recentMovements
  .map((movement) => `${movement.itemName} ${movement.type} ${movement.quantity} on ${movement.timestamp}`)
  .join("; ") || "none"}
- Sample inventory records: ${snapshot.inventoryLookup
  .slice(0, 12)
  .map(
    (item) =>
      `${item.name} [${item.sku}] stock ${item.currentStock}${item.unit}, min ${item.minStockLevel}, max ${item.maxStockLevel}, status ${item.stockStatus}, supplier ${item.supplierName}, category ${item.categoryName}, location ${item.location}`,
  )
  .join("; ") || "none"}`;
}

function buildIntentHints(message: string, snapshot: ChatContextSnapshot | null) {
  if (!snapshot) {
    return "";
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("running low")) {
    return `Low stock items right now: ${snapshot.lowStockItems
      .map((item) => `${item.name} (${item.currentStock} on hand)`)
      .join(", ") || "none"}`;
  }

  if (normalized.includes("recent activity")) {
    return `Recent activity: ${snapshot.recentMovements
      .map((movement) => `${movement.itemName} ${movement.type} ${movement.quantity} at ${movement.timestamp}`)
      .join("; ") || "none"}`;
  }

  if (
    normalized.includes("how much") ||
    normalized.includes("stock") ||
    normalized.includes("quantity") ||
    normalized.includes("have") ||
    normalized.includes("inventory")
  ) {
    const match = matchInventoryItem(message, snapshot);
    if (match) {
      return `Matched inventory item: ${match.name} (${match.sku}) currently has ${match.currentStock} ${match.unit} on hand at ${match.location}. Stock status is ${match.stockStatus}. Min level is ${match.minStockLevel}, max level is ${match.maxStockLevel}, supplier is ${match.supplierName}, and category is ${match.categoryName}.`;
    }
  }

  if (normalized.includes("reorder") || normalized.includes("restock")) {
    const match = matchInventoryItem(message, snapshot);
    const prediction = snapshot.predictions.find((item) => item.itemId === match?.id);
    if (match && prediction) {
      return `Matched item ${match.name}. Recommended reorder quantity is ${prediction.recommendedReorderQty} with urgency ${prediction.urgency}. Reasoning: ${prediction.reasoning}`;
    }

    if (match) {
      const shortage = Math.max(0, match.minStockLevel - match.currentStock);
      return shortage > 0
        ? `Matched item ${match.name}. It is below minimum stock by ${shortage} ${match.unit}. Supplier is ${match.supplierName}, location is ${match.location}, and current stock is ${match.currentStock} ${match.unit}.`
        : `Matched item ${match.name}. It is not currently below minimum stock. Current stock is ${match.currentStock} ${match.unit}, minimum is ${match.minStockLevel}, and supplier is ${match.supplierName}.`;
    }
  }

  if (
    normalized.includes("supplier") ||
    normalized.includes("category") ||
    normalized.includes("location") ||
    normalized.includes("price")
  ) {
    const match = matchInventoryItem(message, snapshot);
    if (match) {
      return `Matched item ${match.name}. SKU ${match.sku}, supplier ${match.supplierName}, category ${match.categoryName}, location ${match.location}, cost price ${match.costPrice}, selling price ${match.sellingPrice}, updated ${match.updatedAt}.`;
    }
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages: UIMessage[]; snapshot?: ChatContextSnapshot | null };
    const latestMessage = body.messages.at(-1)?.parts
      ?.filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join(" ")
      .trim() ?? "";
    const snapshot = body.snapshot ?? null;
    const intentHints = buildIntentHints(latestMessage, snapshot);

    const result = streamText({
      model: getAIModel(),
      system: `You are StockBot, an assistant for this inventory management system. You can answer questions about inventory levels, item records, stock movements, suppliers, locations, pricing, low stock alerts, and predictions. Be concise and data-driven. Base answers on the provided Firebase snapshot data and say when information is missing instead of inventing it.

${buildSnapshotText(snapshot)}

${intentHints ? `Intent hint: ${intentHints}` : ""}`,
      messages: convertToModelMessages(body.messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unable to process chat request.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}
