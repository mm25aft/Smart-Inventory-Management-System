import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { initializeApp } from "firebase/app";
import { collection, doc, getDocs, getFirestore, writeBatch } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

export const SEED_SYSTEM_UID = "seed-system";
export const SEED_TAG = "dummy-large-v1";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const contents = fs.readFileSync(filePath, "utf8");
  const parsed = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function getEnv() {
  return {
    ...parseEnvFile(path.join(projectRoot, ".env")),
    ...parseEnvFile(path.join(projectRoot, ".env.local")),
    ...process.env,
  };
}

export function createFirebaseContext() {
  const env = getEnv();
  const requiredKeys = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  const missingKeys = requiredKeys.filter((key) => !env[key]);
  if (missingKeys.length > 0) {
    throw new Error(`Missing Firebase env vars: ${missingKeys.join(", ")}`);
  }

  const app = initializeApp({
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  return {
    db: getFirestore(app),
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  };
}

export function createRng(seed) {
  let current = seed % 2147483647;
  if (current <= 0) {
    current += 2147483646;
  }

  return () => {
    current = (current * 16807) % 2147483647;
    return (current - 1) / 2147483646;
  };
}

export function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickOne(rng, values) {
  return values[randomInt(rng, 0, values.length - 1)];
}

export function isoDaysAgo(daysAgo, hour = 9, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function chunk(values, size) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

export async function commitOperations(db, operations) {
  const batches = chunk(operations, 400);

  for (const [batchIndex, items] of batches.entries()) {
    const batch = writeBatch(db);

    for (const operation of items) {
      const docRef = operation.docId ? doc(db, operation.collectionName, operation.docId) : null;

      if (!docRef) {
        throw new Error(`Operation is missing a docId for ${operation.collectionName}.`);
      }

      if (operation.type === "set") {
        batch.set(docRef, operation.data);
      } else {
        batch.delete(docRef);
      }
    }

    await batch.commit();
    console.log(`Committed batch ${batchIndex + 1}/${batches.length} (${items.length} writes)`);
  }
}

export function setOperation(collectionName, docId, data) {
  return {
    type: "set",
    collectionName,
    docId,
    data,
  };
}

export function deleteOperation(collectionName, docId) {
  return {
    type: "delete",
    collectionName,
    docId,
  };
}

export async function clearSeedData(db) {
  const collections = ["auditLogs", "stockMovements", "inventory", "suppliers", "categories", "users"];
  const operations = [];

  for (const collectionName of collections) {
    const snapshot = await getDocs(collection(db, collectionName));

    for (const item of snapshot.docs) {
      if (isSeedDocument(collectionName, item.id)) {
        operations.push(deleteOperation(collectionName, item.id));
      }
    }
  }

  if (operations.length === 0) {
    console.log("No existing seed data found.");
    return 0;
  }

  await commitOperations(db, operations);
  return operations.length;
}

function isSeedDocument(collectionName, docId) {
  if (collectionName === "users") {
    return docId === SEED_SYSTEM_UID || docId.startsWith("seed-user-");
  }

  const prefixes = {
    categories: "seed-category-",
    suppliers: "seed-supplier-",
    inventory: "seed-item-",
    stockMovements: "seed-movement-",
    auditLogs: "seed-audit-",
  };

  return docId.startsWith(prefixes[collectionName] ?? "seed-");
}
