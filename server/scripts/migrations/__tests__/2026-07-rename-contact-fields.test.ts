import { describe, it, expect, vi } from "vitest";
import { runMigration } from "../2026-07-rename-contact-fields";

describe("2026-07-rename-contact-fields migration", () => {
  function makeFakeCollection(counts: { unmigrated: number; migrated: number }) {
    return {
      countDocuments: vi.fn((filter: Record<string, unknown>) => {
        if (filter.nom) return Promise.resolve(counts.unmigrated);
        if (filter.name) return Promise.resolve(counts.migrated);
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

  it("real run renames the 4 fields", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    await runMigration(collection as never, { dryRun: false });

    expect(collection.updateMany).toHaveBeenCalledWith(
      { nom: { $exists: true } },
      {
        $rename: {
          nom: "name",
          lien: "link",
          poste: "position",
          tel: "phone",
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
