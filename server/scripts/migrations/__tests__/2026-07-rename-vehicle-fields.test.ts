import { describe, it, expect, vi } from "vitest";
import { runMigration, DOCUMENT_TYPE_REMAP } from "../2026-07-rename-vehicle-fields";

describe("2026-07-rename-vehicle-fields migration", () => {
  function makeFakeCollection(counts: { unmigrated: number; migrated: number }) {
    return {
      countDocuments: vi.fn((filter: Record<string, unknown>) => {
        if (filter.marque) return Promise.resolve(counts.unmigrated);
        if (filter.brand) return Promise.resolve(counts.migrated);
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

  it("real run renames the 8 fields, remaps format values, and remaps nested documents[].type", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    await runMigration(collection as never, { dryRun: false });

    expect(collection.updateMany).toHaveBeenCalledWith(
      { marque: { $exists: true } },
      {
        $rename: {
          marque: "brand",
          modele: "model",
          immatriculation: "licensePlate",
          dateRevision: "serviceDate",
          dateCtInspection: "inspectionDate",
          dateCtExpiration: "inspectionExpiryDate",
          dateControlAntiPollutionInspection: "antiPollutionInspectionDate",
          dateControlAntiPollutionExpiration: "antiPollutionExpiryDate",
        },
      },
    );
    expect(collection.updateMany).toHaveBeenCalledWith(
      { format: "utilitaire" },
      { $set: { format: "van" } },
    );
    expect(collection.updateMany).toHaveBeenCalledWith(
      { format: "camion" },
      { $set: { format: "truck" } },
    );

    // Nested array remap: aggregation-pipeline update targeting any vehicle
    // whose documents array still contains an old type value.
    expect(collection.updateMany).toHaveBeenCalledWith(
      { documents: { $elemMatch: { type: { $in: ["facture_revision", "ct", "autre"] } } } },
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
                            {
                              case: { $eq: ["$$doc.type", "facture_revision"] },
                              then: "service_invoice",
                            },
                            { case: { $eq: ["$$doc.type", "ct"] }, then: "inspection" },
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
    );
  });

  it("is a no-op on the $rename step when nothing is left to migrate", async () => {
    const collection = makeFakeCollection({ unmigrated: 0, migrated: 5 });
    await runMigration(collection as never, { dryRun: false });
    expect(collection.updateMany).not.toHaveBeenCalledWith(
      { marque: { $exists: true } },
      expect.anything(),
    );
    // Format/document remaps are unconditional (idempotent no-ops when there's
    // nothing left matching their filters) — same pattern as the format/status
    // remap steps in the item migration.
    expect(collection.updateMany).toHaveBeenCalledWith(
      { format: "utilitaire" },
      { $set: { format: "van" } },
    );
  });

  // ─── DOCUMENT_TYPE_REMAP semantics ─────────────────────────────────────────
  // The aggregation pipeline's $switch branches are built directly from this
  // map, so verifying the map's behaviour against a JS re-implementation of
  // the same $map/$switch semantics proves the per-element remap logic is
  // correct for a documents array containing several different types at once
  // — including values that must NOT change (anti_pollution, and already-
  // migrated values, for idempotency).
  function applyDocTypeRemap(docs: { type: string }[]): { type: string }[] {
    return docs.map((doc) => ({
      ...doc,
      type: DOCUMENT_TYPE_REMAP[doc.type] ?? doc.type,
    }));
  }

  describe("DOCUMENT_TYPE_REMAP", () => {
    it("maps all 3 legacy document types to their English equivalents", () => {
      expect(DOCUMENT_TYPE_REMAP).toEqual({
        facture_revision: "service_invoice",
        ct: "inspection",
        autre: "other",
      });
    });

    it("remaps every element of a mixed-type documents array in one pass", () => {
      const docs = [
        { type: "facture_revision" },
        { type: "ct" },
        { type: "anti_pollution" },
        { type: "autre" },
      ];
      expect(applyDocTypeRemap(docs)).toEqual([
        { type: "service_invoice" },
        { type: "inspection" },
        { type: "anti_pollution" },
        { type: "other" },
      ]);
    });

    it("is idempotent — already-migrated or untouched types pass through unchanged", () => {
      const docs = [
        { type: "service_invoice" },
        { type: "inspection" },
        { type: "other" },
        { type: "anti_pollution" },
      ];
      expect(applyDocTypeRemap(docs)).toEqual(docs);
    });
  });
});
