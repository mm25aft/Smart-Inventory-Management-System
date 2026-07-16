import { NextResponse } from "next/server";

import { generatePredictionsWithAI } from "@/lib/claude";
import { getPredictionInputs } from "@/lib/firestore";

export async function POST() {
  try {
    const inputs = await getPredictionInputs();
    const predictions = await generatePredictionsWithAI(inputs);
    return NextResponse.json({ predictions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate predictions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
