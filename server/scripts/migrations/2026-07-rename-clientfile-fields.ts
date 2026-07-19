import mongoose, { Collection } from "mongoose";
import { resolveMongoURI } from "../../config/db";

interface RunOptions {
  dryRun: boolean;
}

// Top-level field renames (everything except `equipement`, which is renamed
// separately below, and the fields left unchanged: siret, mobile, email,
// contactRef, dateInstallation, dateRenouvellement, createdBy, createdAt,
// updatedAt, documents).
const RENAME_MAP = {
  societe: "company",
  nom: "lastName",
  prenom: "firstName",
  adresse: "address",
  cp: "postalCode",
  ville: "city",
  tel: "phone",
  statutJuridique: "legalStatus",
  raisonSociale: "legalName",
  nomMagasin: "storeName",
  tvaIntra: "vatNumber",
  codeNaf: "nafCode",
  joursFermeture: "closingDays",
  visitePreinstallation: "preInstallationVisit",
  dateInstallationSouhaitee: "desiredInstallationDate",
  dateFormationSouhaitee: "desiredTrainingDate",
  saisirFichierProduit: "productFileEntry",
  decoupePlanMenuiserie: "carpentryPlanCutout",
  decoupePlanMarbrerie: "stoneworkPlanCutout",
  ouverturePrevue: "plannedOpening",
  "equipement.nbCashguard": "equipement.cashguardCount",
  "equipement.nbFusion": "equipement.fusionCount",
  "equipement.nbCaisses": "equipement.registerCount",
  "equipement.nbAutresMateriels": "equipement.otherEquipmentCount",
  "equipement.nbBalancesCaisses": "equipement.scaleCount",
  "equipement.licencesTactis": "equipement.tactisLicenses",
  "equipement.licencesInno": "equipement.innoLicenses",
  "equipement.pcBackoffice": "equipement.backofficePcCount",
  "equipement.pcCentralisation": "equipement.centralizationPcCount",
  "equipement.borneAllergene": "equipement.allergenKiosk",
  "equipement.borneCommande": "equipement.orderKiosk",
  "equipement.etiquettesElectronique": "equipement.electronicLabels",
  "equipement.carteFidelite": "equipement.loyaltyCard",
  remarques: "notes",
} as const;

// `equipement` (the parent key) is renamed to `equipment` in a SEPARATE,
// later step. MongoDB's $rename operates on independent paths within a
// single update, so renaming a parent path (`equipement` → `equipment`) in
// the same $rename document as one of its own child dotted paths
// (`equipement.nbCashguard` → `equipement.cashguardCount`) is unsafe: once
// the parent key no longer exists under its old name, the nested dotted
// rename targeting the old parent path can no longer resolve. Renaming the
// 13 nested fields FIRST (while the parent key is still `equipement`), then
// renaming the parent key itself in a second sequential updateMany,
// sidesteps the ambiguity entirely and is safe/idempotent either way.
const EQUIPEMENT_PARENT_RENAME = { equipement: "equipment" } as const;

// Single source of truth for the nested `documents[].type` value remap —
// shared between the aggregation pipeline built below and the migration's
// own tests.
export const DOCUMENT_TYPE_REMAP: Record<string, string> = {
  bdc: "purchase_order",
  rapport: "report",
  pvrecette: "acceptance_report",
  visite: "visit",
  autre: "other",
};

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
    console.log(
      `Renamed top-level + nested equipement.* fields on ${renameResult.modifiedCount} document(s).`,
    );
  }

  // Rename the `equipement` parent key itself → `equipment`. Sequenced
  // strictly AFTER the nested field rename above (see comment on
  // EQUIPEMENT_PARENT_RENAME).
  const equipementUnmigrated = await collection.countDocuments({ equipement: { $exists: true } });
  if (equipementUnmigrated > 0) {
    const parentRenameResult = await collection.updateMany(
      { equipement: { $exists: true } },
      { $rename: EQUIPEMENT_PARENT_RENAME },
    );
    console.log(
      `Renamed equipement → equipment on ${parentRenameResult.modifiedCount} document(s).`,
    );
  }

  // Remap `documents[].type` values (nested array) via an aggregation-pipeline
  // update — $map over `documents` and $switch each element's `type`. Same
  // approach as the vehicle migration's documents[].type remap.
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
    const collection = mongoose.connection.collection("clientfile");
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
