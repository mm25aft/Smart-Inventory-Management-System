import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import type { PredictionInput, PredictionResult, StockMovement } from "@/types";

const DEFAULT_MODEL = "gpt-4o";

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return apiKey;
}

export function getAIModel(model = DEFAULT_MODEL) {
  void getOpenAIApiKey();
  return openai(model);
}

function getDemandSamples(movements: StockMovement[]) {
  return movements
    .filter((movement) => movement.type === "OUT")
    .map((movement) => movement.quantity);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) {
    return 0;
  }

  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function getSeasonalSpikeFactor(movements: StockMovement[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const lastMonth = (currentMonth + 11) % 12;

  const currentMonthOut = movements
    .filter((movement) => movement.type === "OUT" && new Date(movement.timestamp).getMonth() === currentMonth)
    .reduce((sum, movement) => sum + movement.quantity, 0);
  const lastMonthOut = movements
    .filter((movement) => movement.type === "OUT" && new Date(movement.timestamp).getMonth() === lastMonth)
    .reduce((sum, movement) => sum + movement.quantity, 0);

  if (lastMonthOut === 0) {
    return currentMonthOut > 0 ? 1.1 : 1;
  }

  return Math.max(0.8, Math.min(1.5, currentMonthOut / lastMonthOut));
}

export function computePredictionBaseline(input: PredictionInput): PredictionResult {
  const demandSamples = getDemandSamples(input.movements);
  const avgDemand = average(demandSamples);
  const stdDevDemand = standardDeviation(demandSamples);
  const seasonalSpikeFactor = getSeasonalSpikeFactor(input.movements);
  const leadTimeDays = 7;
  const zScore = 1.65;
  const safetyStock = zScore * stdDevDemand * Math.sqrt(leadTimeDays);
  const predictedDemand7d = Math.round(avgDemand * 7 * seasonalSpikeFactor);
  const predictedDemand14d = Math.round(avgDemand * 14 * seasonalSpikeFactor);
  const predictedDemand30d = Math.round(avgDemand * 30 * seasonalSpikeFactor);
  const recommendedReorderQty = Math.max(
    0,
    Math.ceil(predictedDemand30d + safetyStock - input.item.currentStock),
  );
  const urgency =
    input.item.currentStock <= input.item.minStockLevel
      ? "critical"
      : recommendedReorderQty > 0
        ? "soon"
        : "ok";

  return {
    itemId: input.item.id,
    predictedDemand7d,
    predictedDemand14d,
    predictedDemand30d,
    recommendedReorderQty,
    urgency,
    reasoning: `Average daily demand ${avgDemand.toFixed(2)} units with seasonal factor ${seasonalSpikeFactor.toFixed(2)}.`,
    safetyStock: Number(safetyStock.toFixed(2)),
    averageDailyConsumption: Number(avgDemand.toFixed(2)),
    seasonalSpikeFactor: Number(seasonalSpikeFactor.toFixed(2)),
    leadTimeDays,
    sparkline: demandSamples.slice(-12),
  };
}

function parsePredictionResponse(text: string) {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1] ?? trimmed;
  const arrayStart = candidate.indexOf("[");
  const arrayEnd = candidate.lastIndexOf("]");
  const jsonText =
    arrayStart >= 0 && arrayEnd >= arrayStart ? candidate.slice(arrayStart, arrayEnd + 1) : candidate;

  return JSON.parse(jsonText) as Array<
    Pick<
      PredictionResult,
      | "itemId"
      | "predictedDemand7d"
      | "predictedDemand14d"
      | "predictedDemand30d"
      | "recommendedReorderQty"
      | "urgency"
      | "reasoning"
    >
  >;
}

export async function generatePredictionsWithAI(inputs: PredictionInput[]) {
  const baselines = inputs.map(computePredictionBaseline);

  if (!process.env.OPENAI_API_KEY) {
    return baselines;
  }

  const promptPayload = inputs.map((input, index) => ({
    itemId: input.item.id,
    itemName: input.item.name,
    currentStock: input.item.currentStock,
    minStockLevel: input.item.minStockLevel,
    maxStockLevel: input.item.maxStockLevel,
    unit: input.item.unit,
    supplier: input.supplier?.name ?? null,
    baseline: baselines[index],
    movements: input.movements.map((movement) => ({
      timestamp: movement.timestamp,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      newStock: movement.newStock,
      reason: movement.reason,
    })),
  }));

  try {
    const { text } = await generateText({
      model: getAIModel(),
      system:
        "You are an inventory forecasting assistant. Return JSON only. Use the provided baseline calculations plus historical movement context to produce demand forecasts and reorder recommendations.",
      prompt: `Return a JSON array with objects shaped exactly like:
[
  {
    "itemId": "string",
    "predictedDemand7d": 0,
    "predictedDemand14d": 0,
    "predictedDemand30d": 0,
    "recommendedReorderQty": 0,
    "urgency": "critical" | "soon" | "ok",
    "reasoning": "string"
  }
]

Historical context:
${JSON.stringify(promptPayload)}`,
    });

    const parsed = parsePredictionResponse(text);

    return baselines.map((baseline) => {
      const aiResult = parsed.find((item) => item.itemId === baseline.itemId);
      return aiResult ? { ...baseline, ...aiResult } : baseline;
    });
  } catch (error) {
    console.error("Prediction refinement failed, falling back to baseline forecast.", error);
    return baselines;
  }
}
