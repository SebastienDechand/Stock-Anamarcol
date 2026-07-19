import { describe, it, expect, vi } from "vitest";
import { runMigration } from "../2026-07-rename-shipment-fields";

describe("2026-07-rename-shipment-fields migration", () => {
  function makeFakeCollection(counts: { unmigrated: number; migrated: number }) {
    return {
      countDocuments: vi.fn((filter: Record<string, unknown>) => {
        if (filter.nom) return Promise.resolve(counts.unmigrated);
        if (filter.lastName) return Promise.resolve(counts.migrated);
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

  it("real run renames the 10 fields", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    await runMigration(collection as never, { dryRun: false });

    expect(collection.updateMany).toHaveBeenCalledWith(
      { nom: { $exists: true } },
      {
        $rename: {
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
        },
      },
    );
  });

  it("is a no-op when nothing is left to migrate", async () => {
    const collection = makeFakeCollection({ unmigrated: 0, migrated: 5 });
    await runMigration(collection as never, { dryRun: false });
    expect(collection.updateMany).not.toHaveBeenCalledWith(
      { nom: { $exists: true } },
      expect.anything(),
    );
  });
});
