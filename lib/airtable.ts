import { z } from "zod";

import type { CustomerOrderRecord } from "@/types";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const DEFAULT_TABLE_NAME = "Customer Orders";

const airtableFieldValueSchema = z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]);

const airtableRecordSchema = z.object({
  id: z.string(),
  createdTime: z.string(),
  fields: z.record(z.string(), airtableFieldValueSchema).default({}),
});

const airtablePageSchema = z.object({
  records: z.array(airtableRecordSchema),
  offset: z.string().optional(),
});

function getAirtableConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME ?? DEFAULT_TABLE_NAME;

  if (!apiKey) {
    throw new Error("Missing AIRTABLE_API_KEY.");
  }

  if (!baseId) {
    throw new Error("Missing AIRTABLE_BASE_ID.");
  }

  return { apiKey, baseId, tableName };
}

function buildAirtableUrl(baseId: string, tableName: string, offset?: string) {
  const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`);
  url.searchParams.set("pageSize", "100");
  if (offset) {
    url.searchParams.set("offset", offset);
  }
  return url;
}

const FIELD_ALIASES = {
  customerName: ["Customer name", "Customer Name", "Name", "Customer"],
  customerContactNumber: ["Customer contact number", "Customer Contact Number", "Contact Number", "Phone", "Phone Number"],
  orderIdentifier: ["Order identifier", "Order Identifier", "Order ID", "OrderId"],
  orderedProductDetails: [
    "Ordered product details",
    "Ordered Product Details",
    "Ordered Products",
    "Products",
    "Product details",
  ],
} as const;

function normalizeFieldValue(value: z.infer<typeof airtableFieldValueSchema> | undefined) {
  if (value === undefined) {
    return "";
  }

  return Array.isArray(value) ? value.map(String).join(", ").trim() : String(value).trim();
}

function pickField(
  fields: Record<string, z.infer<typeof airtableFieldValueSchema>>,
  aliases: readonly string[],
) {
  for (const alias of aliases) {
    const value = normalizeFieldValue(fields[alias]);
    if (value) {
      return value;
    }
  }

  return "";
}

function toCustomerOrderRecord(record: z.infer<typeof airtableRecordSchema>): CustomerOrderRecord | null {
  const customerName = pickField(record.fields, FIELD_ALIASES.customerName);
  const customerContactNumber = pickField(record.fields, FIELD_ALIASES.customerContactNumber);
  const orderIdentifier = pickField(record.fields, FIELD_ALIASES.orderIdentifier);
  const orderedProductDetails = pickField(record.fields, FIELD_ALIASES.orderedProductDetails);

  if (!customerName || !customerContactNumber || !orderIdentifier || !orderedProductDetails) {
    return null;
  }

  return {
    id: record.id,
    createdTime: record.createdTime,
    customerName,
    customerContactNumber,
    orderIdentifier,
    orderedProductDetails,
  };
}

export async function listCustomerOrdersFromAirtable() {
  const { apiKey, baseId, tableName } = getAirtableConfig();
  const records: CustomerOrderRecord[] = [];

  let offset: string | undefined;

  do {
    const response = await fetch(buildAirtableUrl(baseId, tableName, offset), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Airtable request failed with status ${response.status}.`);
    }

    const json = (await response.json()) as unknown;
    const page = airtablePageSchema.parse(json);

    for (const record of page.records) {
      const normalized = toCustomerOrderRecord(record);
      if (normalized) {
        records.push(normalized);
      }
    }
    offset = page.offset;
  } while (offset);

  return records;
}
