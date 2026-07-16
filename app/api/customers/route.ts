import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { listCustomerOrdersFromAirtable } from "@/lib/airtable";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const customers = await listCustomerOrdersFromAirtable();
    return NextResponse.json({ customers });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "Airtable CRM data does not match the expected customer order schema."
        : error instanceof Error
          ? error.message
          : "Unable to load customer records from Airtable.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
