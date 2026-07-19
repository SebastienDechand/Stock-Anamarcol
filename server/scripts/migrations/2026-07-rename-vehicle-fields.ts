import mongoose, { Collection } from "mongoose";
import { resolveMongoURI } from "../../config/db";

interface RunOptions {
  dryRun: boolean;
}

const RENAME_MAP = {
  marque: "brand",
  modele: "model",
  immatriculation: "licensePlate",
  dateRevision: "serviceDate",
  dateCtInspection: "inspectionDate",
  dateCtExpiration: "inspectionExpiryDate",
  dateControlAntiPollutionInspection: "antiPollutionInspectionDate",
  dateControlAntiPollutionExpiration: "antiPollutionExpiryDate",
} as const;

// Single source of truth for the nested `documents[].type` value remap —
// shared between the aggregation pipeline built below and the migration's
// own tests. `anti_pollution` is intentionally absent: its value is unchanged.
export const DOCUMENT_TYPE_REMAP: Record<string, string> = {
  facture_revision: "service_invoice",
  ct: "inspection",
  autre: "other",
};

export async function runMigration(
  collection: Collection,
  { dryRun }: RunOptions,
): Promise<void> {
  const unmigrated = await collection.countDocuments({ marque: { $exists: true } });
  const migrated = await collection.countDocuments({ brand: { $exists: true } });
  console.log(`Pre-flight: ${unmigrated} document(s) to migrate, ${migrated} already migrated.`);

  if (dryRun) {
    const sample = await collection.find({ marque: { $exists: true } }).limit(3).toArray();
    console.log("Dry run — sample of documents that would be migrated:", sample);
    return;
  }

  if (unmigrated > 0) {
    const renameResult = await collection.updateMany(
      { marque: { $exists: true } },
      { $rename: RENAME_MAP },
    );
    console.log(`Renamed fields on ${renameResult.modifiedCount} document(s).`);
  }

  // Remap `format` values.
  const vanResult = await collection.updateMany(
    { format: "utilitaire" },
    { $set: { format: "van" } },
  );
  const truckResult = await collection.updateMany(
    { format: "camion" },
    { $set: { format: "truck" } },
  );
  console.log(
    `Remapped format: ${vanResult.modifiedCount} → van, ${truckResult.modifiedCount} → truck.`,
  );

  // Remap `documents[].type` values (nested array) via an aggregation-pipeline
  // update — $map over `documents` and $switch each element's `type`. Using an
  // aggregation pipeline (rather than a positional/arrayFilters update) lets a
  // single updateMany remap every element of every vehicle's documents array
  // in one idempotent pass, regardless of how many documents it has.
  const oldTypes = Object.keys(DOCUMENT_TYPE_REMAP);
  const docTypeSwitch = {
    $switch: {
      branches: oldTypes.map((oldType) => ({
        case: { $eq: ["$$doc.type", oldType] },
        then: DOCUMENT_TYPE_REMAP[oldType],
      })),
      default: "$$doc.type",
    },
  };
  const docsResult = await collection.updateMany(
    { documents: { $elemMatch: { type: { $in: oldTypes } } } },
    [
      {
        $set: {
          documents: {
            $map: {
              input: "$documents",
              as: "doc",
              in: { $mergeObjects: ["$$doc", { type: docTypeSwitch }] },
            },
          },
        },
      },
    ],
  );
  console.log(`Remapped nested documents[].type on ${docsResult.modifiedCount} document(s).`);

  const afterMigrated = await collection.countDocuments({ brand: { $exists: true } });
  const sample = await collection.find({ brand: { $exists: true } }).limit(3).toArray();
  console.log(`Post-flight: ${afterMigrated} document(s) now migrated. Sample:`, sample);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const uri = await resolveMongoURI();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Connected (dry-run: ${dryRun}).`);

  try {
    const collection = mongoose.connection.collection("vehicle");
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
