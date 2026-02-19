/**
 * Cleanup script — remove legacy `role` field from all users
 *
 * Safe to run at any time; only affects documents that still have the field.
 *
 * Run once:
 *   npx ts-node --project tsconfig.json scripts/removeUserLegacyRole.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { resolveMongoURI } from "../config/db";

dotenv.config({ path: "./config/.env" });

if (!process.env.DB_USER_PASS) {
  console.error("❌  DB_USER_PASS not set in config/.env");
  process.exit(1);
}

async function main() {
  const uri = await resolveMongoURI();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, family: 4 });
  console.log("✅  Connected to MongoDB");

  const db = mongoose.connection.db!;
  const collection = db.collection("users");

  // Count impacted documents before update
  const count = await collection.countDocuments({ role: { $exists: true } });
  console.log(`Found ${count} user(s) with legacy 'role' field`);

  if (count === 0) {
    console.log("Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  const result = await collection.updateMany(
    { role: { $exists: true } },
    { $unset: { role: "" } },
  );

  console.log(`\n✅  Done — ${result.modifiedCount} user(s) updated`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌  Script failed:", err);
  process.exit(1);
});
