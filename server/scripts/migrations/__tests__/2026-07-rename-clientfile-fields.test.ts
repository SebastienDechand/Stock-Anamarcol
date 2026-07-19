import { describe, it, expect, vi } from "vitest";
import { runMigration, DOCUMENT_TYPE_REMAP } from "../2026-07-rename-clientfile-fields";

describe("2026-07-rename-clientfile-fields migration", () => {
  function makeFakeCollection(counts: {
    unmigrated: number;
    migrated: number;
    equipementUnmigrated?: number;
  }) {
    return {
      countDocuments: vi.fn((filter: Record<string, unknown>) => {
        if (filter.nom) return Promise.resolve(counts.unmigrated);
        if (filter.lastName) return Promise.resolve(counts.migrated);
        if (filter.equipement) {
          return Promise.resolve(counts.equipementUnmigrated ?? counts.unmigrated);
        }
        return Promise.resolve(0);
      }),
      updateMany: vi.fn().mockResolvedValue({ modifiedCount: counts.unmigrated }),
      find: vi.fn(() => ({
        limit: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
      })),
    };
  }

  it("dry run only counts, never calls updateMany", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    await runMigration(collection as never, { dryRun: true });
    expect(collection.updateMany).not.toHaveBeenCalled();
  });

  it("real run renames top-level + nested equipement.* fields in one call, then renames the equipement parent key in a separate call, then remaps documents[].type", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    await runMigration(collection as never, { dryRun: false });

    const calls = collection.updateMany.mock.calls;

    // Step 1: top-level + nested dotted-path renames, single $rename call,
    // while `equipement` is still the parent key name.
    expect(calls[0]).toEqual([
      { nom: { $exists: true } },
      {
        $rename: {
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
        },
      },
    ]);

    // Step 2: parent key rename, strictly AFTER step 1 (separate call).
    expect(calls[1]).toEqual([
      { equipement: { $exists: true } },
      { $rename: { equipement: "equipment" } },
    ]);

    // Step 3: documents[].type aggregation-pipeline remap.
    expect(calls[2]).toEqual([
      { documents: { $elemMatch: { type: { $in: ["bdc", "rapport", "pvrecette", "visite", "autre"] } } } },
      [
        {
          $set: {
            documents: {
              $map: {
                input: "$documents",
                as: "doc",
                in: {
                  $mergeObjects: [
                    "$$doc",
                    {
                      type: {
                        $switch: {
                          branches: [
                            { case: { $eq: ["$$doc.type", "bdc"] }, then: "purchase_order" },
                            { case: { $eq: ["$$doc.type", "rapport"] }, then: "report" },
                            { case: { $eq: ["$$doc.type", "pvrecette"] }, then: "acceptance_report" },
                            { case: { $eq: ["$$doc.type", "visite"] }, then: "visit" },
                            { case: { $eq: ["$$doc.type", "autre"] }, then: "other" },
                          ],
                          default: "$$doc.type",
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ],
    ]);
  });

  it("is idempotent — no $rename calls when nothing is left to migrate", async () => {
    const collection = makeFakeCollection({ unmigrated: 0, migrated: 5, equipementUnmigrated: 0 });
    await runMigration(collection as never, { dryRun: false });
    expect(collection.updateMany).not.toHaveBeenCalledWith(
      { nom: { $exists: true } },
      expect.anything(),
    );
    expect(collection.updateMany).not.toHaveBeenCalledWith(
      { equipement: { $exists: true } },
      expect.anything(),
    );
    // The documents[].type remap step is unconditional (idempotent no-op
    // when nothing matches its filter) — same pattern as the vehicle
    // migration's format/document remap steps.
    expect(collection.updateMany).toHaveBeenCalledWith(
      { documents: { $elemMatch: { type: { $in: ["bdc", "rapport", "pvrecette", "visite", "autre"] } } } },
      expect.anything(),
    );
  });

  // ─── Nested rename ordering: simulated final-shape proof ──────────────────
  // MongoDB's $rename operates on independent field paths within a single
  // update document. Renaming a parent path (`equipement` → `equipment`) in
  // the SAME $rename op as one of its own children's dotted paths
  // (`equipement.nbCashguard` → `equipement.cashguardCount`) is unsafe
  // territory: nothing in MongoDB's docs guarantees how a parent-path rename
  // and a same-parent child dotted-path rename interact when evaluated
  // together. The migration avoids the ambiguity entirely by never doing
  // both in one operation — nested fields are renamed first (parent key
  // still `equipement`), then the parent key itself is renamed in a second,
  // sequential updateMany. This block proves that two-step sequence, applied
  // in order to a plain JS object via a faithful re-implementation of
  // MongoDB's $rename semantics, produces the exact target shape.
  function applyRename(doc: Record<string, unknown>, renameMap: Record<string, string>) {
    const result: Record<string, unknown> = { ...doc };
    for (const [from, to] of Object.entries(renameMap)) {
      if (from.includes(".")) {
        const [parentKey, childKey] = from.split(".");
        const parent = result[parentKey] as Record<string, unknown> | undefined;
        if (parent && Object.prototype.hasOwnProperty.call(parent, childKey)) {
          const [, toChildKey] = to.split(".");
          const newParent = { ...parent };
          newParent[toChildKey] = newParent[childKey];
          delete newParent[childKey];
          result[parentKey] = newParent;
        }
      } else if (Object.prototype.hasOwnProperty.call(result, from)) {
        result[to] = result[from];
        delete result[from];
      }
    }
    return result;
  }

  it("produces the exact final shape { equipment: { cashguardCount, ... } } via the two-step sequence", () => {
    const original = {
      nom: "Dupont",
      societe: "ACME",
      equipement: {
        nbCashguard: 2,
        nbFusion: 1,
        nbCaisses: 3,
        nbAutresMateriels: 0,
        nbBalancesCaisses: 1,
        licencesTactis: 5,
        licencesInno: 0,
        pcBackoffice: 2,
        pcCentralisation: 1,
        borneAllergene: true,
        borneCommande: false,
        etiquettesElectronique: true,
        carteFidelite: false,
      },
    };

    // Step 1: nested renames (parent key still `equipement`) + top-level.
    const afterStep1 = applyRename(original, {
      nom: "lastName",
      societe: "company",
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
    });

    expect(afterStep1.equipement).toEqual({
      cashguardCount: 2,
      fusionCount: 1,
      registerCount: 3,
      otherEquipmentCount: 0,
      scaleCount: 1,
      tactisLicenses: 5,
      innoLicenses: 0,
      backofficePcCount: 2,
      centralizationPcCount: 1,
      allergenKiosk: true,
      orderKiosk: false,
      electronicLabels: true,
      loyaltyCard: false,
    });
    // Parent key not yet renamed.
    expect(afterStep1).not.toHaveProperty("equipment");

    // Step 2: rename the parent key itself.
    const afterStep2 = applyRename(afterStep1, { equipement: "equipment" });

    expect(afterStep2).toEqual({
      lastName: "Dupont",
      company: "ACME",
      equipment: {
        cashguardCount: 2,
        fusionCount: 1,
        registerCount: 3,
        otherEquipmentCount: 0,
        scaleCount: 1,
        tactisLicenses: 5,
        innoLicenses: 0,
        backofficePcCount: 2,
        centralizationPcCount: 1,
        allergenKiosk: true,
        orderKiosk: false,
        electronicLabels: true,
        loyaltyCard: false,
      },
    });
    expect(afterStep2).not.toHaveProperty("equipement");
    // Nothing left half-renamed (no `equipement.cashguardCount`-style mix).
    expect(afterStep2).not.toHaveProperty("nom");
    expect(afterStep2).not.toHaveProperty("societe");
  });

  // ─── DOCUMENT_TYPE_REMAP semantics ─────────────────────────────────────────
  function applyDocTypeRemap(docs: { type: string }[]): { type: string }[] {
    return docs.map((doc) => ({
      ...doc,
      type: DOCUMENT_TYPE_REMAP[doc.type] ?? doc.type,
    }));
  }

  describe("DOCUMENT_TYPE_REMAP", () => {
    it("maps all 5 legacy document types to their English equivalents", () => {
      expect(DOCUMENT_TYPE_REMAP).toEqual({
        bdc: "purchase_order",
        rapport: "report",
        pvrecette: "acceptance_report",
        visite: "visit",
        autre: "other",
      });
    });

    it("remaps every element of a mixed-type documents array in one pass", () => {
      const docs = [
        { type: "bdc" },
        { type: "rapport" },
        { type: "pvrecette" },
        { type: "visite" },
        { type: "autre" },
      ];
      expect(applyDocTypeRemap(docs)).toEqual([
        { type: "purchase_order" },
        { type: "report" },
        { type: "acceptance_report" },
        { type: "visit" },
        { type: "other" },
      ]);
    });

    it("is idempotent — already-migrated types pass through unchanged", () => {
      const docs = [
        { type: "purchase_order" },
        { type: "report" },
        { type: "acceptance_report" },
        { type: "visit" },
        { type: "other" },
      ];
      expect(applyDocTypeRemap(docs)).toEqual(docs);
    });
  });
});
