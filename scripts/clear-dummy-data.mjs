import { clearSeedData, createFirebaseContext } from "./firebase-seed-utils.mjs";

async function main() {
  const { db, projectId } = createFirebaseContext();
  console.log(`Connected to Firebase project: ${projectId}`);
  const deletedCount = await clearSeedData(db);
  console.log(`Removed ${deletedCount} seeded documents.`);
}

main().catch((error) => {
  console.error("Failed to clear dummy dataset.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
