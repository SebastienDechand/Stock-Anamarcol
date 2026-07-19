import mongoose, { Collection } from "mongoose";
import { resolveMongoURI } from "../../config/db";

interface RunOptions {
  dryRun: boolean;
}

// Top-level field renames. `twCaisses` "replaces" the fixed `twCaisse1/2/3`
// fields per the model's own comment, meaning a document may have the legacy
// individual fields, the array form, or both — MongoDB's $rename silently
// skips any key that doesn't exist on a given document, so a single $rename
// listing all 4 mappings safely handles every combination in one pass.
const RENAME_MAP = {
  twCaisse1: "twRegister1",
  twCaisse2: "twRegister2",
  twCaisse3: "twRegister3",
  twCaisses: "twRegisters",
} as const;

// Filter matching any document still carrying at least one legacy top-level
// field (individual caisse fields and/or the array form).
const LEGACY_TOP_LEVEL_FILTER = {
  $or: [
    { twCaisse1: { $exists: true } },
    { twCaisse2: { $exists: true } },
    { twCaisse3: { $exists: true } },
    { twCaisses: { $exists: true } },
  ],
};

const MIGRATED_TOP_LEVEL_FILTER = {
  $or: [{ twRegister1: { $exists: true } }, { twRegisters: { $exists: true } }],
};

// Filter matching any document whose cashguardUnits array still has at least
// one element carrying a legacy key (nSerie / k7Slots / assignedCaisses).
const LEGACY_UNIT_FILTER = {
  cashguardUnits: {
    $elemMatch: {
      $or: [
        { nSerie: { $exists: true } },
        { k7Slots: { $exists: true } },
        { assignedCaisses: { $exists: true } },
      ],
    },
  },
};

export async function runMigration(
  collection: Collection,
  { dryRun }: RunOptions,
): Promise<void> {
  const unmigrated = await collection.countDocuments(LEGACY_TOP_LEVEL_FILTER);
  const migrated = await collection.countDocuments(MIGRATED_TOP_LEVEL_FILTER);
  console.log(`Pre-flight: ${unmigrated} document(s) to migrate, ${migrated} already migrated.`);

  if (dryRun) {
    const sample = await collection.find(LEGACY_TOP_LEVEL_FILTER).limit(3).toArray();
    console.log("Dry run — sample of documents that would be migrated:", sample);
    const unitSample = await collection.find(LEGACY_UNIT_FILTER).limit(3).toArray();
    console.log("Dry run — sample of documents with legacy cashguardUnits keys:", unitSample);
    return;
  }

  if (unmigrated > 0) {
    const renameResult = await collection.updateMany(LEGACY_TOP_LEVEL_FILTER, {
      $rename: RENAME_MAP,
    });
    console.log(`Renamed top-level TW fields on ${renameResult.modifiedCount} document(s).`);
  }

  // Rename keys within each element of the `cashguardUnits` array (nested
  // array of sub-documents, not a single embedded object) via an
  // aggregation-pipeline update. A dotted-path $rename only works within a
  // single embedded object, not across every element of an array, so each
  // element is reconstructed with the new key names via $map. Every field is
  // wrapped in $ifNull(oldKey, newKey) so the rename is safe/idempotent even
  // if some elements were already migrated (falls back to the already-correct
  // new value instead of clobbering it with a missing old field).
  const unitsResult = await collection.updateMany(LEGACY_UNIT_FILTER, [
    {
      $set: {
        cashguardUnits: {
          $map: {
            input: "$cashguardUnits",
            as: "u",
            in: {
              up: "$$u.up",
              ub: "$$u.ub",
              serialNumber: { $ifNull: ["$$u.nSerie", "$$u.serialNumber"] },
              cassetteSlots: { $ifNull: ["$$u.k7Slots", "$$u.cassetteSlots"] },
              assignedRegisters: { $ifNull: ["$$u.assignedCaisses", "$$u.assignedRegisters"] },
              hasPc: "$$u.hasPc",
            },
          },
        },
      },
    },
  ]);
  console.log(`Renamed nested cashguardUnits[] keys on ${unitsResult.modifiedCount} document(s).`);

  const afterMigrated = await collection.countDocuments(MIGRATED_TOP_LEVEL_FILTER);
  const sample = await collection.find(MIGRATED_TOP_LEVEL_FILTER).limit(3).toArray();
  console.log(`Post-flight: ${afterMigrated} document(s) now migrated. Sample:`, sample);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const uri = await resolveMongoURI();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Connected (dry-run: ${dryRun}).`);

  try {
    const collection = mongoose.connection.collection("interventionreport");
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
