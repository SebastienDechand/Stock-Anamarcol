import mongoose, { Collection } from "mongoose";
import { resolveMongoURI } from "../../config/db";

interface RunOptions {
  dryRun: boolean;
}

const RENAME_MAP = {
  pseudo: "username",
  poste: "position",
  numero: "phone",
  pole: "department",
} as const;

export async function runMigration(
  collection: Collection,
  { dryRun }: RunOptions,
): Promise<void> {
  const unmigrated = await collection.countDocuments({ pseudo: { $exists: true } });
  const migrated = await collection.countDocuments({ username: { $exists: true } });
  console.log(`Pre-flight: ${unmigrated} document(s) to migrate, ${migrated} already migrated.`);

  if (dryRun) {
    const sample = await collection.find({ pseudo: { $exists: true } }).limit(3).toArray();
    console.log("Dry run — sample of documents that would be migrated:", sample);
    return;
  }

  if (unmigrated > 0) {
    const renameResult = await collection.updateMany(
      { pseudo: { $exists: true } },
      { $rename: RENAME_MAP },
    );
    console.log(`Renamed fields on ${renameResult.modifiedCount} document(s).`);
  }

  const managementResult = await collection.updateMany(
    { department: "Direction" },
    { $set: { department: "Management" } },
  );
  const warehouseResult = await collection.updateMany(
    { department: "Entrepôt" },
    { $set: { department: "Warehouse" } },
  );
  const installerResult = await collection.updateMany(
    { department: "Monteur" },
    { $set: { department: "Installer" } },
  );
  const siteManagementResult = await collection.updateMany(
    { department: "Gestion du site" },
    { $set: { department: "Site Management" } },
  );
  console.log(
    `Remapped department: ${managementResult.modifiedCount} → Management, ` +
      `${warehouseResult.modifiedCount} → Warehouse, ` +
      `${installerResult.modifiedCount} → Installer, ` +
      `${siteManagementResult.modifiedCount} → Site Management.`,
  );

  const afterMigrated = await collection.countDocuments({ username: { $exists: true } });
  const sample = await collection.find({ username: { $exists: true } }).limit(3).toArray();
  console.log(`Post-flight: ${afterMigrated} document(s) now migrated. Sample:`, sample);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const uri = await resolveMongoURI();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Connected (dry-run: ${dryRun}).`);

  try {
    const collection = mongoose.connection.collection("user");
    await runMigration(collection, { dryRun });
    console.log("Migration finished successfully.");
    process.exitCode = 0;
  } catch (err) {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  void main();
}
