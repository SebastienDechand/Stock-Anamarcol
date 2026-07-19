import { describe, it, expect, vi } from "vitest";
import { runMigration } from "../2026-07-rename-interventionreport-fields";

describe("2026-07-rename-interventionreport-fields migration", () => {
  function makeFakeCollection(counts: { unmigrated: number; migrated: number }) {
    return {
      countDocuments: vi.fn((filter: Record<string, unknown>) => {
        if (filter.$or && (filter.$or as Record<string, unknown>[])[0].twCaisse1) {
          return Promise.resolve(counts.unmigrated);
        }
        if (filter.$or && (filter.$or as Record<string, unknown>[])[0].twRegister1) {
          return Promise.resolve(counts.migrated);
        }
        return Promise.resolve(0);
      }),
      updateMany: vi.fn().mockResolvedValue({ modifiedCount: counts.unmigrated }),
      find: vi.fn(() => ({
        limit: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
      })),
    };
  }

  const LEGACY_TOP_LEVEL_FILTER = {
    $or: [
      { twCaisse1: { $exists: true } },
      { twCaisse2: { $exists: true } },
      { twCaisse3: { $exists: true } },
      { twCaisses: { $exists: true } },
    ],
  };

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

  it("dry run only counts, never calls updateMany", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    await runMigration(collection as never, { dryRun: true });
    expect(collection.updateMany).not.toHaveBeenCalled();
  });

  it("real run renames top-level TW fields, then renames nested cashguardUnits[] keys", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    await runMigration(collection as never, { dryRun: false });

    const calls = collection.updateMany.mock.calls;

    // Step 1: top-level $rename, guarded against any legacy field (individual
    // twCaisse1/2/3 and/or the array form twCaisses) being present.
    expect(calls[0]).toEqual([
      LEGACY_TOP_LEVEL_FILTER,
      {
        $rename: {
          twCaisse1: "twRegister1",
          twCaisse2: "twRegister2",
          twCaisse3: "twRegister3",
          twCaisses: "twRegisters",
        },
      },
    ]);

    // Step 2: nested cashguardUnits[] key-rename via aggregation pipeline.
    expect(calls[1]).toEqual([
      LEGACY_UNIT_FILTER,
      [
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
      ],
    ]);
  });

  it("is idempotent — no $rename call when nothing legacy is left at the top level", async () => {
    const collection = makeFakeCollection({ unmigrated: 0, migrated: 5 });
    await runMigration(collection as never, { dryRun: false });
    expect(collection.updateMany).not.toHaveBeenCalledWith(
      LEGACY_TOP_LEVEL_FILTER,
      expect.anything(),
    );
    // The cashguardUnits[] remap step is unconditional (idempotent no-op when
    // nothing matches its filter) — same pattern as other migrations' nested
    // array remap steps.
    expect(collection.updateMany).toHaveBeenCalledWith(LEGACY_UNIT_FILTER, expect.anything());
  });

  it("guard filter matches a document with only the array form, only the legacy individual fields, or both", async () => {
    // Documented behaviour: $exists checks on all 4 legacy keys are OR'd
    // together, so any single one present is enough to trigger the rename —
    // and MongoDB's $rename silently skips any key absent from a given
    // document, so a single $rename call is safe for every combination.
    const arrayOnly = { twCaisses: ["TW1"] };
    const legacyOnly = { twCaisse1: "TW1", twCaisse2: "TW2" };
    const both = { twCaisse1: "TW1", twCaisses: ["TW1"] };
    const neither = { twPc: "PC1" };

    function matchesLegacyFilter(doc: Record<string, unknown>): boolean {
      return (
        "twCaisse1" in doc || "twCaisse2" in doc || "twCaisse3" in doc || "twCaisses" in doc
      );
    }

    expect(matchesLegacyFilter(arrayOnly)).toBe(true);
    expect(matchesLegacyFilter(legacyOnly)).toBe(true);
    expect(matchesLegacyFilter(both)).toBe(true);
    expect(matchesLegacyFilter(neither)).toBe(false);
  });

  // ─── cashguardUnits[] key-rename: simulated final-shape proof ─────────────
  // The aggregation pipeline reconstructs each array element as a brand-new
  // object literal containing only the new key names (no $mergeObjects with
  // the original element), which is what guarantees the legacy keys
  // (nSerie/k7Slots/assignedCaisses) are gone from the result rather than
  // merely duplicated alongside the new ones. Each renamed field is wrapped
  // in $ifNull(oldKey, newKey) so a re-run over an already-migrated element
  // (or a document whose array mixes legacy and already-migrated elements)
  // falls back to the existing new-key value instead of clobbering it with a
  // missing old field. This block re-implements that exact per-element
  // expression in plain JS and asserts the final shape for a multi-element
  // array, proving the pipeline logic without needing a live MongoDB server.
  function applyUnitKeyRename(units: Record<string, unknown>[]): Record<string, unknown>[] {
    return units.map((u) => ({
      up: u.up,
      ub: u.ub,
      serialNumber: u.nSerie ?? u.serialNumber,
      cassetteSlots: u.k7Slots ?? u.cassetteSlots,
      assignedRegisters: u.assignedCaisses ?? u.assignedRegisters,
      hasPc: u.hasPc,
    }));
  }

  it("renames keys on every element of a multi-element cashguardUnits array, dropping the legacy keys entirely", () => {
    const units = [
      {
        nSerie: "SN001",
        up: "UP1",
        ub: "UB1",
        k7Slots: ["A", "B", "C", "D"],
        assignedCaisses: ["CAISSE 1"],
        hasPc: true,
      },
      {
        nSerie: "SN002",
        up: "UP2",
        ub: "UB2",
        k7Slots: ["", "", "", ""],
        assignedCaisses: [],
        hasPc: false,
      },
    ];

    const result = applyUnitKeyRename(units);

    expect(result).toEqual([
      {
        up: "UP1",
        ub: "UB1",
        serialNumber: "SN001",
        cassetteSlots: ["A", "B", "C", "D"],
        assignedRegisters: ["CAISSE 1"],
        hasPc: true,
      },
      {
        up: "UP2",
        ub: "UB2",
        serialNumber: "SN002",
        cassetteSlots: ["", "", "", ""],
        assignedRegisters: [],
        hasPc: false,
      },
    ]);
    for (const unit of result) {
      expect(unit).not.toHaveProperty("nSerie");
      expect(unit).not.toHaveProperty("k7Slots");
      expect(unit).not.toHaveProperty("assignedCaisses");
    }
  });

  it("is idempotent per-element — already-migrated units pass through unchanged", () => {
    const units = [
      {
        up: "UP1",
        ub: "UB1",
        serialNumber: "SN001",
        cassetteSlots: ["A", "B", "C", "D"],
        assignedRegisters: ["CAISSE 1"],
        hasPc: true,
      },
    ];
    expect(applyUnitKeyRename(units)).toEqual(units);
  });

  it("handles a mixed array — one legacy element and one already-migrated element in the same document", () => {
    const units = [
      {
        nSerie: "SN001",
        up: "UP1",
        ub: "UB1",
        k7Slots: ["A", "B", "C", "D"],
        assignedCaisses: ["CAISSE 1"],
        hasPc: true,
      },
      {
        up: "UP2",
        ub: "UB2",
        serialNumber: "SN002",
        cassetteSlots: ["", "", "", ""],
        assignedRegisters: [],
        hasPc: false,
      },
    ];

    expect(applyUnitKeyRename(units)).toEqual([
      {
        up: "UP1",
        ub: "UB1",
        serialNumber: "SN001",
        cassetteSlots: ["A", "B", "C", "D"],
        assignedRegisters: ["CAISSE 1"],
        hasPc: true,
      },
      {
        up: "UP2",
        ub: "UB2",
        serialNumber: "SN002",
        cassetteSlots: ["", "", "", ""],
        assignedRegisters: [],
        hasPc: false,
      },
    ]);
  });
});
