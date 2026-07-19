import { describe, it, expect, vi } from "vitest";
import { runMigration } from "../2026-07-rename-user-fields";

describe("2026-07-rename-user-fields migration", () => {
  function makeFakeCollection(counts: { unmigrated: number; migrated: number }) {
    return {
      countDocuments: vi.fn((filter: Record<string, unknown>) => {
        if (filter.pseudo) return Promise.resolve(counts.unmigrated);
        if (filter.username) return Promise.resolve(counts.migrated);
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
      { pseudo: { $exists: true } },
      {
        $rename: {
          pseudo: "username",
          poste: "position",
          numero: "phone",
          pole: "department",
        },
      },
    );
  });

  it("is a no-op on the field rename when nothing is left to migrate", async () => {
    const collection = makeFakeCollection({ unmigrated: 0, migrated: 5 });
    await runMigration(collection as never, { dryRun: false });
    expect(collection.updateMany).not.toHaveBeenCalledWith(
      { pseudo: { $exists: true } },
      expect.anything(),
    );
  });

  it("remaps the department enum values after renaming", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    await runMigration(collection as never, { dryRun: false });

    expect(collection.updateMany).toHaveBeenCalledWith(
      { department: "Direction" },
      { $set: { department: "Management" } },
    );
    expect(collection.updateMany).toHaveBeenCalledWith(
      { department: "Entrepôt" },
      { $set: { department: "Warehouse" } },
    );
    expect(collection.updateMany).toHaveBeenCalledWith(
      { department: "Monteur" },
      { $set: { department: "Installer" } },
    );
    expect(collection.updateMany).toHaveBeenCalledWith(
      { department: "Gestion du site" },
      { $set: { department: "Site Management" } },
    );
  });

  it("does not remap the department enum values before the field rename runs", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    const calls: string[] = [];
    collection.updateMany.mockImplementation((filter: Record<string, unknown>) => {
      calls.push(JSON.stringify(filter));
      return Promise.resolve({ modifiedCount: 1 });
    });

    await runMigration(collection as never, { dryRun: false });

    const renameIndex = calls.findIndex((c) => c.includes("pseudo"));
    const remapIndex = calls.findIndex((c) => c.includes("Direction"));
    expect(renameIndex).toBeGreaterThanOrEqual(0);
    expect(remapIndex).toBeGreaterThan(renameIndex);
  });
});
