import { NextResponse } from "next/server";

import { generatePredictionsWithAI } from "@/lib/claude";
import { getPredictionInputs, toCsv } from "@/lib/firestore";

export async function POST() {
  try {
    const inputs = await getPredictionInputs();
    const predictions = await generatePredictionsWithAI(inputs);
    const criticalItems = predictions.filter((prediction) => prediction.urgency === "critical");
    const content = toCsv(
      criticalItems.map((prediction) => {
        const input = inputs.find((item) => item.item.id === prediction.itemId);
        return {
          itemName: input?.item.name ?? prediction.itemId,
          sku: input?.item.sku ?? "",
          currentStock: input?.item.currentStock ?? 0,
          predictedDemand30d: prediction.predictedDemand30d,
          recommendedReorderQty: prediction.recommendedReorderQty,
          urgency: prediction.urgency,
          reasoning: prediction.reasoning,
        };
      }),
      ["itemName", "sku", "currentStock", "predictedDemand30d", "recommendedReorderQty", "urgency", "reasoning"],
    );

    return NextResponse.json({
      fileName: `reorder-report-${new Date().toISOString().slice(0, 10)}.csv`,
      content,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to export reorder report." },
      { status: 500 },
    );
  }
}
