/**
 * Migration script — backfill roles[] from legacy role field
 *
 * For each user whose roles[] is empty (pre-migration),
 * initialise roles[] from their existing role value.
 *
 * Run once:
 *   npx ts-node --project tsconfig.json scripts/migrateUserRoles.ts
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { Role } from "../constants";
import { resolveMongoURI } from "../config/db";

dotenv.config({ path: "./config/.env" });

if (!process.env.DB_USER_PASS) {
  console.error("❌  DB_USER_PASS not set in config/.env");
  process.exit(1);
}

// Mapping from old single role → new roles array
function toRolesArray(role: string | undefined): Role[] {
  switch (role) {
    case Role.SUPERADMIN:
      return [Role.SUPERADMIN, Role.ADMIN, Role.USER];
    case Role.ADMIN:
      return [Role.ADMIN, Role.USER];
    case Role.HOTLINE:
      return [Role.USER, Role.HOTLINE];
    case Role.MONTEUR:
      return [Role.USER, Role.MONTEUR];
    case Role.USER:
    default:
      return [Role.USER];
  }
}

async function main() {
  const uri = await resolveMongoURI();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, family: 4 });
  console.log("✅  Connected to MongoDB");

  const db = mongoose.connection.db!;
  const collection = db.collection("users");

  // Find users whose roles array is empty or missing
  const users = await collection
    .find({ $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }] })
    .toArray();

  console.log(`Found ${users.length} user(s) to migrate`);

  let migrated = 0;
  for (const user of users) {
    const legacyRole = user.role as string | undefined;
    const newRoles = toRolesArray(legacyRole);

    await collection.updateOne(
      { _id: user._id },
      { $set: { roles: newRoles } },
    );

    console.log(
      `  → ${user.pseudo ?? user.email}  [${legacyRole ?? "none"}]  =>  ${newRoles.join(", ")}`,
    );
    migrated++;
  }

  console.log(`\n✅  Migration complete — ${migrated} user(s) updated`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
