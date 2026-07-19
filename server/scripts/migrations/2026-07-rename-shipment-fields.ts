import mongoose, { Collection } from "mongoose";
import { resolveMongoURI } from "../../config/db";

interface RunOptions {
  dryRun: boolean;
}

const RENAME_MAP = {
  nom: "lastName",
  prenom: "firstName",
  tel: "phone",
  tel2: "phone2",
  adresse: "address",
  codePostal: "postalCode",
  ville: "city",
  societe: "company",
  societeOuFonction: "companyOrRole",
  piece: "part",
} as const;

export async function runMigration(
  collection: Collection,
  { dryRun }: RunOptions,
): Promise<void> {
  const unmigrated = await collection.countDocuments({ nom: { $exists: true } });
  const migrated = await collection.countDocuments({ lastName: { $exists: true } });
  console.log(`Pre-flight: ${unmigrated} document(s) to migrate, ${migrated} already migrated.`);

  if (dryRun) {
    const sample = await collection.find({ nom: { $exists: true } }).limit(3).toArray();
    console.log("Dry run — sample of documents that would be migrated:", sample);
    return;
  }

  if (unmigrated > 0) {
    const renameResult = await collection.updateMany(
      { nom: { $exists: true } },
      { $rename: RENAME_MAP },
    );
    console.log(`Renamed fields on ${renameResult.modifiedCount} document(s).`);
  }

  const afterMigrated = await collection.countDocuments({ lastName: { $exists: true } });
  const sample = await collection.find({ lastName: { $exists: true } }).limit(3).toArray();
  console.log(`Post-flight: ${afterMigrated} document(s) now migrated. Sample:`, sample);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const uri = await resolveMongoURI();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Connected (dry-run: ${dryRun}).`);

  try {
    const collection = mongoose.connection.collection("shipment");
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
