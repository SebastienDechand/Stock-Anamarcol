# Item Model French→English Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the `item` model's French field names to English end-to-end — MongoDB documents, backend (Express/Mongoose), and both frontends (Angular `client-ng`, legacy React `client`) — as the pilot pass for a larger multi-model migration.

**Architecture:** No DTO/translation layer exists anywhere in the stack — the French field names ARE the wire contract from MongoDB through the API to both frontends' TypeScript types. This means the rename must land in lockstep across all three layers, and the missing-DTO-layer weakness doubles as the safety net: `tsc --noEmit` on both frontends turns any missed occurrence into a compile error.

**Tech Stack:** Node.js 20, Express 5, TypeScript 5, Mongoose 9, MongoDB Atlas, Angular 21 (NgRx, signals), React 19 (Redux, Vite).

## Global Constraints

- Field mapping (exact, apply everywhere): `denomination→name`, `quantite→quantity`, `fournisseur→supplier`, `etat→status`, `prepaCG→cgKit`, `prepaTPV→tpvKit`.
- Stored `etat`/`status` values: `"Neuf"→"NEW"`, `"SAV"→"RMA"`.
- Extended vocabulary renamed too: response keys `fournisseurs→suppliers`, `etats→statuses`; route segments `/statistics/fournisseurs/*→/statistics/suppliers/*`, `/statistics/etats/*→/statistics/statuses/*`; constants `FOURNISSEURS→SUPPLIERS`, `ETATS→STATUSES`.
- Untouched fields: `posterId`, `modifierName`, `image`, `createdAt`, `updatedAt`, `_id`.
- Out of scope (do not touch): i18n translation keys (`ITEMS.DENOMINATION` etc.), French display labels/headers in CSV/PDF/XLSX exports (`'Dénomination'`, `'Fournisseur'`, `'État'`, `'Quantité'`, `'Prépa CG'`, `'Prépa TPV'`, `'Oui'/'Non'`), the `contacts`/suppliers-directory entity (`contacts-page.ts`, `contacts.facade.ts`, `contacts.tsx` — different model, unrelated `fournisseurs` naming collision), the other 9 models, `features/surveillance/**`, `features/fleet/**`.
- Full spec: `docs/superpowers/specs/2026-07-09-item-model-en-migration.md`.

---

## Task 1: Migration script

**Files:**
- Create: `server/scripts/migrations/2026-07-rename-item-fields.ts`
- Test: `server/scripts/migrations/__tests__/2026-07-rename-item-fields.test.ts`

**Interfaces:**
- Produces: an idempotent, standalone script run via `npx ts-node server/scripts/migrations/2026-07-rename-item-fields.ts [--dry-run]`. No other task depends on its internals, only on it having been run before Task 2's model change goes live against real data.

- [ ] **Step 1: Write the failing test**

Uses Vitest with a mocked Mongo collection (`vi.fn()`, same mocking style as the rest of `server/__tests__`), asserting the script builds the correct `$rename` and value-remap update calls without needing a real database. (Note: this backend runs on Vitest, not Jest — `npm test` → `vitest run`, despite CLAUDE.md's stale reference to Jest.)

```ts
// server/scripts/migrations/__tests__/2026-07-rename-item-fields.test.ts
import { describe, it, expect, vi } from "vitest";
import { runMigration } from "../2026-07-rename-item-fields";

describe("2026-07-rename-item-fields migration", () => {
  function makeFakeCollection(counts: { unmigrated: number; migrated: number }) {
    return {
      countDocuments: vi.fn((filter: Record<string, unknown>) => {
        if (filter.denomination) return Promise.resolve(counts.unmigrated);
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

  it("real run renames the 6 fields then remaps status values", async () => {
    const collection = makeFakeCollection({ unmigrated: 3, migrated: 0 });
    await runMigration(collection as never, { dryRun: false });

    expect(collection.updateMany).toHaveBeenCalledWith(
      { denomination: { $exists: true } },
      {
        $rename: {
          denomination: "name",
          quantite: "quantity",
          fournisseur: "supplier",
          etat: "status",
          prepaCG: "cgKit",
          prepaTPV: "tpvKit",
        },
      },
    );
    expect(collection.updateMany).toHaveBeenCalledWith(
      { status: "Neuf" },
      { $set: { status: "NEW" } },
    );
    expect(collection.updateMany).toHaveBeenCalledWith(
      { status: "SAV" },
      { $set: { status: "RMA" } },
    );
  });

  it("is a no-op when nothing is left to migrate", async () => {
    const collection = makeFakeCollection({ unmigrated: 0, migrated: 5 });
    await runMigration(collection as never, { dryRun: false });
    expect(collection.updateMany).not.toHaveBeenCalledWith(
      { denomination: { $exists: true } },
      expect.anything(),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run scripts/migrations/__tests__/2026-07-rename-item-fields.test.ts`
Expected: FAIL with "Cannot find module '../2026-07-rename-item-fields'"

- [ ] **Step 3: Write the implementation**

```ts
// server/scripts/migrations/2026-07-rename-item-fields.ts
import mongoose, { Collection } from "mongoose";
import { resolveMongoURI } from "../../config/db";

interface RunOptions {
  dryRun: boolean;
}

const RENAME_MAP = {
  denomination: "name",
  quantite: "quantity",
  fournisseur: "supplier",
  etat: "status",
  prepaCG: "cgKit",
  prepaTPV: "tpvKit",
} as const;

export async function runMigration(
  collection: Collection,
  { dryRun }: RunOptions,
): Promise<void> {
  const unmigrated = await collection.countDocuments({ denomination: { $exists: true } });
  const migrated = await collection.countDocuments({ name: { $exists: true } });
  console.log(`Pre-flight: ${unmigrated} document(s) to migrate, ${migrated} already migrated.`);

  if (dryRun) {
    const sample = await collection.find({ denomination: { $exists: true } }).limit(3).toArray();
    console.log("Dry run — sample of documents that would be migrated:", sample);
    return;
  }

  if (unmigrated > 0) {
    const renameResult = await collection.updateMany(
      { denomination: { $exists: true } },
      { $rename: RENAME_MAP },
    );
    console.log(`Renamed fields on ${renameResult.modifiedCount} document(s).`);
  }

  const newResult = await collection.updateMany({ status: "Neuf" }, { $set: { status: "NEW" } });
  const rmaResult = await collection.updateMany({ status: "SAV" }, { $set: { status: "RMA" } });
  console.log(`Remapped status: ${newResult.modifiedCount} → NEW, ${rmaResult.modifiedCount} → RMA.`);

  const afterMigrated = await collection.countDocuments({ name: { $exists: true } });
  const sample = await collection.find({ name: { $exists: true } }).limit(3).toArray();
  console.log(`Post-flight: ${afterMigrated} document(s) now migrated. Sample:`, sample);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const uri = resolveMongoURI();
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`Connected (dry-run: ${dryRun}).`);

  try {
    const collection = mongoose.connection.collection("item");
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
```

Check `server/config/db.ts` exports a `resolveMongoURI` (or equivalently-named) function before writing the import — if the actual exported name differs, use that name instead; the intent is "reuse the existing URI-resolution logic, do not call the retrying `connectDB`".

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run scripts/migrations/__tests__/2026-07-rename-item-fields.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Manual dry-run rehearsal (not part of the automated suite, do this before committing)**

Run against a local MongoDB (not production): `cd server && npx ts-node scripts/migrations/2026-07-rename-item-fields.ts --dry-run`
Confirm the pre-flight counts look sane against your local seed data.

- [ ] **Step 6: Commit**

```bash
git add server/scripts/migrations/2026-07-rename-item-fields.ts server/scripts/migrations/__tests__/2026-07-rename-item-fields.test.ts
git commit -m "feat: add item field rename migration script"
```

---

## Task 2: Backend model, constants, and error/stats types

**Files:**
- Modify: `server/models/item.model.ts`
- Modify: `server/constants/index.ts`
- Modify: `server/types/errors.ts`
- Modify: `server/types/stats.ts`
- Test: `server/__tests__/constants.test.ts`

**Interfaces:**
- Produces: `IItem { posterId?, modifierName?, name, quantity, supplier, image?, status, cgKit?, tpvKit?, createdAt, updatedAt }`; `STATUSES = ["NEW","RMA"]`, `type Status`; `SUPPLIERS` (same values as old `FOURNISSEURS`); `CreateItemError { name, supplier, status, quantity }`; `SupplierOrStateStats { nom, ... }` (unchanged in this task); `DashboardGlobalStats { ..., cgKit, tpvKit }` (renamed from `prepaCG/prepaTPV`); `LowStockItemResult { _id, name, supplier, status, quantity }`; `DashboardResult { global, suppliers, statuses, lowStockItems }`.
- Consumes: nothing from earlier tasks (this is the foundation layer).

- [ ] **Step 1: Update `server/__tests__/constants.test.ts` to expect the new names first**

Open the file, find every assertion referencing `ETATS`, `Etat`, `FOURNISSEURS`, `Fournisseur`, `"Neuf"`, `"SAV"` and rewrite to `STATUSES`, `Status`, `SUPPLIERS`, `Supplier`, `"NEW"`, `"RMA"` respectively (keep the same test structure and supplier name list — those are proper nouns, unchanged).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run constants.test.ts`
Expected: FAIL — `STATUSES`/`SUPPLIERS` not exported yet.

- [ ] **Step 3: Update `server/constants/index.ts`**

```ts
// ─── Suppliers ───────────────────────────────────────
export const SUPPLIERS = [
  "Amazon",
  "CashGuard",
  "LDLC",
  "MD Ouest",
  "Monétique et Services",
  "Oxhoo",
  "Solumag",
  "Tigra",
  "TPV Line",
  "VNE",
] as const;

export type Supplier = (typeof SUPPLIERS)[number];

// ─── Statuses ────────────────────────────────────────
export const STATUSES = ["NEW", "RMA"] as const;

export type Status = (typeof STATUSES)[number];
```

(Keep the rest of the file — `MAX_FILE_SIZE`, `ACCEPTED_IMAGE_TYPES`, `LOW_STOCK_THRESHOLD`, `Role`, `ROLES`, `JWT_MAX_AGE`, `COOKIE_MAX_AGE` — exactly as-is, unrelated to this migration.)

- [ ] **Step 4: Update `server/models/item.model.ts`**

```ts
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IItem extends Document {
  posterId?: string;
  modifierName?: string;
  name: string;
  quantity: number;
  supplier: string;
  image?: string;
  status: string;
  cgKit?: boolean;
  tpvKit?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    posterId: {
      type: String,
    },
    modifierName: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    supplier: {
      type: String,
      required: true,
      index: true,
    },
    image: {
      type: String,
      default: "./logo_small.jpg",
    },
    status: {
      type: String,
      required: true,
      index: true,
    },
    cgKit: {
      type: Boolean,
      default: false,
    },
    tpvKit: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for frequent filters
ItemSchema.index({ supplier: 1, status: 1, name: 1 });
// Index for low-stock queries
ItemSchema.index({ quantity: 1 });

const ItemModel: Model<IItem> = mongoose.model<IItem>("item", ItemSchema);

export default ItemModel;
```

- [ ] **Step 5: Update `server/types/errors.ts`**

```ts
export interface CreateItemError {
  name: string;
  supplier: string;
  status: string;
  quantity: string;
}
```

(Leave `SignUpError`, `SignInError`, `UploadError`, `MongoError` untouched.)

- [ ] **Step 6: Update `server/types/stats.ts`**

```ts
export interface SupplierOrStateStats {
  nom: string;
  numberOfArticles: number;
  totalStock: number;
  numberOfLowStockArticles: number;
}

export interface DashboardGlobalStats {
  numberOfArticles: number;
  totalStock: number;
  numberOfSuppliers: number;
  numberOfLowStockArticles: number;
  cgKit: number;
  tpvKit: number;
}

export interface LowStockItemResult {
  _id: string;
  name: string;
  supplier: string;
  status: string;
  quantity: number;
}

export interface DashboardResult {
  global: DashboardGlobalStats;
  suppliers: SupplierOrStateStats[];
  statuses: SupplierOrStateStats[];
  lowStockItems: LowStockItemResult[];
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd server && npx vitest run constants.test.ts`
Expected: PASS

Run: `cd server && npx tsc --noEmit` — expect many errors in `item.controller.ts`, `stats.controller.ts`, `uploadItem.controller.ts`, `audit.controller.ts`, `errors.utils.ts`, `history.utils.ts`. That's expected — those are Tasks 3–7. Confirm the errors are all in those files (not elsewhere), as a scope check.

- [ ] **Step 8: Commit**

```bash
git add server/models/item.model.ts server/constants/index.ts server/types/errors.ts server/types/stats.ts server/__tests__/constants.test.ts
git commit -m "feat: rename item model fields and related types to English"
```

---

## Task 3: `errors.utils.ts`

**Files:**
- Modify: `server/errors.utils.ts`
- Test: `server/__tests__/errors.utils.test.ts`

**Interfaces:**
- Consumes: `CreateItemError` from Task 2.
- Produces: `createItemErrors(err: Error): CreateItemError` with keys `name/supplier/status/quantity`.

- [ ] **Step 1: Update `server/__tests__/errors.utils.test.ts`**

Find every test case for `createItemErrors`. Rewrite the input `err.message` strings and the expected output object keys: `denomination→name`, `fournisseur→supplier`, `etat→status`, `quantite→quantity`. For the `etat`/`status` case specifically, update the expected message text from `"L'état de la pièce doit être Neuf ou SAV"` to `"L'état de la pièce doit être NEW ou RMA"`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run errors.utils.test.ts`
Expected: FAIL — old field keys no longer match.

- [ ] **Step 3: Update `server/errors.utils.ts`**

```ts
// Item creation validation errors
export const createItemErrors = (err: Error): CreateItemError => {
  const errors: CreateItemError = {
    name: "",
    supplier: "",
    status: "",
    quantity: "",
  };

  if (err.message.includes("name"))
    errors.name = "Dénomination incorrect ou déjà prise";
  if (err.message.includes("supplier"))
    errors.supplier = "Nommez un fournisseur valide";
  if (err.message.includes("status"))
    errors.status = "L'état de la pièce doit être NEW ou RMA";
  if (err.message.includes("quantity"))
    errors.quantity = "La quantité attendue est un nombre";

  console.error(err);
  return errors;
};
```

(Leave `signUpErrors`, `signInErrors`, `uploadErrors` untouched — only `createItemErrors` changes.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx vitest run errors.utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/errors.utils.ts server/__tests__/errors.utils.test.ts
git commit -m "feat: rename item field keys in createItemErrors"
```

---

## Task 4: `history.utils.ts`

**Files:**
- Modify: `server/utils/history.utils.ts`
- Test: `server/__tests__/history.utils.test.ts`

**Interfaces:**
- Produces: `TRACKED_FIELDS = ["name","supplier","status","cgKit","tpvKit","image"]`; `logItemDelete(itemId, name, userName)` now logs `field: "name"`; `logItemChanges` quantity special-case keys on `"quantity"`.
- Consumed by: Task 5 (`item.controller.ts` calls `logItemCreate`/`logItemChanges`/`logItemDelete`).

- [ ] **Step 1: Update `server/__tests__/history.utils.test.ts`**

Rewrite every mock `oldItem`/`newData` object and expected `HistoryModel.create`/`insertMany` call: field keys `denomination→name`, `fournisseur→supplier`, `etat→status`, `prepaCG→cgKit`, `prepaTPV→tpvKit`; the quantity-change special case now checks `newData.quantity`/`oldItem.quantity` and logs `field: "quantity"`; `logItemDelete` calls now pass a `name` argument and expect `field: "name"`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run history.utils.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `server/utils/history.utils.ts`**

```ts
import HistoryModel from "../models/history.model";

type ItemSnapshot = Record<string, unknown>;

const TRACKED_FIELDS = [
  "name",
  "supplier",
  "status",
  "cgKit",
  "tpvKit",
  "image",
] as const;

export async function logItemCreate(
  itemId: string,
  userName: string,
): Promise<void> {
  try {
    await HistoryModel.create({
      itemId,
      action: "create",
      userName,
    });
  } catch (err) {
    console.error("History log error (create):", err);
  }
}

export async function logItemDelete(
  itemId: string,
  name: string,
  userName: string,
): Promise<void> {
  try {
    await HistoryModel.create({
      itemId,
      action: "delete",
      field: "name",
      oldValue: name,
      userName,
    });
  } catch (err) {
    console.error("History log error (delete):", err);
  }
}

export async function logItemChanges(
  itemId: string,
  oldItem: ItemSnapshot,
  newData: Record<string, unknown>,
  userName: string,
): Promise<void> {
  try {
    const entries: Array<{
      itemId: string;
      action: string;
      field: string;
      oldValue: string;
      newValue: string;
      userName: string;
    }> = [];

    // Check quantity change separately
    if (
      Object.prototype.hasOwnProperty.call(newData, "quantity") &&
      Number(newData.quantity) !== Number(oldItem.quantity)
    ) {
      entries.push({
        itemId,
        action: "quantity_change",
        field: "quantity",
        oldValue: String(oldItem.quantity),
        newValue: String(newData.quantity),
        userName,
      });
    }

    // Check tracked fields
    for (const field of TRACKED_FIELDS) {
      if (
        Object.prototype.hasOwnProperty.call(newData, field) &&
        String(newData[field]) !== String(oldItem[field])
      ) {
        entries.push({
          itemId,
          action: "update",
          field,
          oldValue: String(oldItem[field] ?? ""),
          newValue: String(newData[field]),
          userName,
        });
      }
    }

    if (entries.length > 0) {
      await HistoryModel.insertMany(entries);
    }
  } catch (err) {
    console.error("History log error (update):", err);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && npx vitest run history.utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/utils/history.utils.ts server/__tests__/history.utils.test.ts
git commit -m "feat: rename tracked item fields in history logging"
```

---

## Task 5: `item.controller.ts` and `uploadItem.controller.ts`

**Files:**
- Modify: `server/controllers/item.controller.ts`
- Modify: `server/controllers/uploadItem.controller.ts`
- Test: `server/__tests__/item.controller.test.ts`

**Interfaces:**
- Consumes: `IItem` (Task 2), `createItemErrors` (Task 3), `logItemCreate`/`logItemChanges`/`logItemDelete` (Task 4).
- Produces: `readItem` accepts query params `supplier`, `status`, `cgKit`, `tpvKit`, `sortBy` (default `"name"`); `createItem`/`updateItem` accept body fields `name/supplier/status/quantity/cgKit/tpvKit`; `prepaBatch` accepts body `prepa: "cgKit" | "tpvKit"`.

- [ ] **Step 1: Update `server/__tests__/item.controller.test.ts`**

This file has ~29 occurrences. Apply this exact mapping to every request body, query param, mock `ItemModel` document, and response assertion in the file: `denomination→name`, `quantite→quantity`, `fournisseur→supplier`, `etat→status`, `prepaCG→cgKit`, `prepaTPV→tpvKit`. Specifically:
- `readItem` tests: query params `?fournisseur=X&etat=Y&prepaCG=true&prepaTPV=true&sortBy=denomination` → `?supplier=X&status=Y&cgKit=true&tpvKit=true&sortBy=name`; filter/sort assertions on `filter.fournisseur`, `filter.etat`, `filter.quantite`, `filter.denomination` → `filter.supplier`, `filter.status`, `filter.quantity`, `filter.name`.
- `prepaBatch` tests: request body `{ prepa: "prepaCG", ... }` / `{ prepa: "prepaTPV", ... }` → `{ prepa: "cgKit", ... }` / `{ prepa: "tpvKit", ... }`; any mock item with `denomination: "... cassette ..."` → `name: "... cassette ..."`; assertions on `item.quantite` → `item.quantity`.
- `createItem`/`updateItem` tests: request bodies and mock created/updated items use the new field names throughout.
- `deleteItem` tests: mock item `{ denomination: "..." }` → `{ name: "..." }`, and the `logItemDelete` call assertion updates its second argument accordingly.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run item.controller.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `server/controllers/item.controller.ts`**

```ts
import { Request, Response } from "express";
import ItemModel from "../models/item.model";
import { createItemErrors } from "../errors.utils";
import { validateObjectId } from "../utils/validate.utils";
import {
  logItemCreate,
  logItemChanges,
  logItemDelete,
} from "../utils/history.utils";
import { logEvent } from "../utils/audit.utils";
import { invalidateStatsCache } from "./stats.controller";

export const itemInfo = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const item = await ItemModel.findById(req.params.id).lean();
    if (!item) {
      res.status(404).json({ message: "Article introuvable" });
      return;
    }
    res.status(200).json(item);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// Paginated read with server-side filters
export const readItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      supplier = "",
      status = "",
      lowStock,
      cgKit,
      tpvKit,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (supplier) {
      filter.supplier = { $in: (supplier as string).split(",") };
    }
    if (status) {
      filter.status = { $in: (status as string).split(",") };
    }
    if (lowStock === "true") {
      filter.quantity = { $lt: 5 };
    }
    if (cgKit === "true") {
      filter.cgKit = true;
    }
    if (tpvKit === "true") {
      filter.tpvKit = true;
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy as string]: sortOrder === "desc" ? -1 : 1,
    };
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const queries: Promise<unknown>[] = [
      ItemModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      ItemModel.countDocuments(filter),
    ];

    // If a prepa filter is active, check if decrement is possible
    const prepaFields: string[] = [];
    if (cgKit === "true") prepaFields.push("cgKit");
    if (tpvKit === "true") prepaFields.push("tpvKit");

    if (prepaFields.length > 0) {
      for (const field of prepaFields) {
        // An item blocks decrement if qty=0, or for CG+cassette if qty<4
        queries.push(
          ItemModel.countDocuments({
            [field]: true,
            $or: [
              { quantity: { $lte: 0 } },
              ...(field === "cgKit"
                ? [
                    {
                      name: { $regex: /cassette/i },
                      quantity: { $lt: 4 },
                    },
                  ]
                : []),
            ],
          }),
        );
      }
    }

    const results = await Promise.all(queries);
    const items = results[0];
    const totalCount = results[1] as number;

    const response: Record<string, unknown> = {
      items,
      total: totalCount,
      page: parseInt(page as string),
      totalPages: Math.ceil(totalCount / parseInt(limit as string)),
    };

    if (prepaFields.length > 0) {
      const canDecrement: Record<string, boolean> = {};
      prepaFields.forEach((field, i) => {
        canDecrement[field] = (results[2 + i] as number) === 0;
      });
      response.canDecrement = canDecrement;
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const createItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    name,
    quantity,
    supplier,
    status,
    posterId,
    modifierName,
    cgKit,
    tpvKit,
  } = req.body;
  try {
    const item = await ItemModel.create({
      name,
      supplier,
      status,
      quantity: parseInt(quantity, 10) || 0,
      posterId,
      modifierName,
      cgKit: cgKit || false,
      tpvKit: tpvKit || false,
    });

    try {
      logItemCreate(
        String(item._id),
        res.locals.user?.pseudo || modifierName || "Inconnu",
      );
    } catch (err) {
      console.error("logItemCreate error:", err);
    }

    invalidateStatsCache();
    res.status(201).json({ item });
  } catch (err) {
    const errors = createItemErrors(err as Error);
    res.status(400).json({ errors });
  }
};

export const updateItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const item = await ItemModel.findById(req.params.id);

    if (!item) {
      res.status(404).json({ message: "Article introuvable" });
      return;
    }

    // Snapshot old values before mutation (guard for mocked objects)
    const oldItem: Record<string, unknown> =
      typeof item.toObject === "function"
        ? (item.toObject() as unknown as Record<string, unknown>)
        : { ...item };

    if (req.body.name) item.name = req.body.name;
    if (req.body.supplier) item.supplier = req.body.supplier;
    if (req.body.status) item.status = req.body.status;

    if (Object.prototype.hasOwnProperty.call(req.body, "quantity")) {
      item.quantity = req.body.quantity < 0 ? 0 : req.body.quantity;
    }

    if (req.body.image) item.image = req.body.image;
    if (req.body.modifierName) item.modifierName = req.body.modifierName;

    if (Object.prototype.hasOwnProperty.call(req.body, "cgKit")) {
      item.cgKit = req.body.cgKit;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "tpvKit")) {
      item.tpvKit = req.body.tpvKit;
    }

    const updatedItem = await item.save();

    try {
      logItemChanges(
        req.params.id as string,
        oldItem,
        req.body,
        res.locals.user?.pseudo ||
          req.body.modifierName ||
          oldItem.modifierName ||
          "Inconnu",
      );
    } catch (err) {
      console.error("logItemChanges error:", err);
    }

    invalidateStatsCache();
    res.status(200).json({ item: updatedItem });
  } catch (err) {
    console.error("Error updating item:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};

export const deleteItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const maybeQuery = ItemModel.findById(req.params.id as string);
    let item: Record<string, unknown> | undefined = undefined;
    if (maybeQuery) {
      if (typeof maybeQuery.lean === "function") {
        item = (await maybeQuery.lean()) as unknown as Record<string, unknown>;
      } else if (
        typeof (maybeQuery as { then?: unknown }).then === "function"
      ) {
        item = (await maybeQuery) as unknown as Record<string, unknown>;
      }
    }

    await ItemModel.deleteOne({ _id: req.params.id }).exec();

    if (item) {
      try {
        logItemDelete(
          req.params.id as string,
          String(item.name ?? ""),
          res.locals.user?.pseudo || "Admin",
        );
      } catch (err) {
        console.error("logItemDelete error:", err);
      }
    }

    invalidateStatsCache();
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting item:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};

// Batch operation on a prepa set: +1/-1 on all items (CG: cassettes = -4/+4)
export const prepaBatch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    prepa,
    operation,
    count: rawCount,
  } = req.body as {
    prepa?: string;
    operation?: string;
    count?: number;
  };
  // count only for increment (restocking)
  const count =
    operation === "increment"
      ? Math.max(1, Math.floor(Number(rawCount) || 1))
      : 1;

  if (!prepa || !["cgKit", "tpvKit"].includes(prepa)) {
    res.status(400).json({ message: "Prépa invalide" });
    return;
  }
  if (!operation || !["increment", "decrement"].includes(operation)) {
    res.status(400).json({ message: "Opération invalide" });
    return;
  }

  try {
    const items = await ItemModel.find({ [prepa]: true });
    const userName = res.locals.user?.pseudo || "Admin";
    let updated = 0;

    for (const item of items) {
      const oldQty = item.quantity;

      // For CG: cassettes change by 4, the rest by 1 — multiplied by count
      let delta = 1 * count;
      if (
        prepa === "cgKit" &&
        item.name.toLowerCase().includes("cassette")
      ) {
        delta = 4 * count;
      }

      const newQty =
        operation === "increment"
          ? oldQty + delta
          : Math.max(0, oldQty - delta);

      if (newQty !== oldQty) {
        item.quantity = newQty;
        await item.save();

        logItemChanges(
          String(item._id),
          { ...item.toObject(), quantity: oldQty },
          { quantity: newQty },
          userName,
        );
        updated++;
      }
    }

    const prepaLabel = prepa === "cgKit" ? "CashGuard" : "Caisse TPV";
    await logEvent("update", "item", undefined, userName, {
      batch: true,
      prepa: prepaLabel,
      operation,
      count: updated,
    });

    invalidateStatsCache();
    res
      .status(200)
      .json({ message: `${updated} articles mis à jour`, updated });
  } catch (err) {
    console.error("Error in prepa batch:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
```

- [ ] **Step 4: Update `server/controllers/uploadItem.controller.ts`**

```ts
import { Request, Response } from "express";
import ItemModel from "../models/item.model";
import { validateUploadedFile, uploadToImgBB } from "../utils/upload.utils";

export const uploadItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateUploadedFile(req, res)) return;

  const fileName =
    req.body.name + req.body.supplier + req.body.status + ".jpg";

  try {
    const imageUrl = await uploadToImgBB(req.file!.buffer, fileName);

    const updatedItem = await ItemModel.findByIdAndUpdate(
      req.body.itemId,
      { $set: { image: imageUrl } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.json(updatedItem);
  } catch (err) {
    console.error("File upload or database update error:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run item.controller.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add server/controllers/item.controller.ts server/controllers/uploadItem.controller.ts server/__tests__/item.controller.test.ts
git commit -m "feat: rename item fields in item and upload controllers"
```

---

## Task 6: `audit.controller.ts` (history feed)

**Files:**
- Modify: `server/controllers/audit.controller.ts`
- Test: `server/__tests__/history.controller.test.ts`

**Interfaces:**
- Consumes: `IItem.name` (Task 2).
- Produces: `getHistory` response `details.name` (renamed from `details.denomination`) — Task 11 (Angular `history-page.ts`) and the equivalent React history page read this key and must match.

- [ ] **Step 1: Update `server/__tests__/history.controller.test.ts`**

Find the mock `ItemModel.find(...).select("denomination")` chain and its resolved value, plus any assertion on `details.denomination` in the expected response — rename to `.select("name")` and `details.name`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npx vitest run history.controller.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `server/controllers/audit.controller.ts`**

Apply these renames only (everything else in the file — contacts `.select("nom")`, users `.select("pseudo")`, `contactNameMap`, `userNameMap`, `superadminMap`, `purgeAllHistoryAndAudit` — stays untouched):

```ts
    // Fetch item denominations for referenced items
    const itemIds = [...new Set(itemHistory.map((h) => String(h.itemId)))];
    const items = await ItemModel.find({ _id: { $in: itemIds } })
      .select("name")
      .lean();
    const nameMap = new Map(items.map((i) => [String(i._id), i.name]));
```

```ts
      auditItemIds.length > 0
        ? ItemModel.find({ _id: { $in: [...new Set(auditItemIds)] } })
            .select("name")
            .lean()
        : [],
```

```ts
    const auditItemNameMap = new Map(
      auditItems.map((i) => [String(i._id), i.name]),
    );
```

```ts
        } else if (e.entity === "item") {
          entityName =
            auditItemNameMap.get(String(e.entityId)) ||
            (details.name as string) ||
            undefined;
        }
```

```ts
    const itemEvents = itemHistory.map((h) => ({
      _id: h._id,
      action: h.action,
      entity: "item",
      entityId: String(h.itemId),
      userName: h.userName,
      details: {
        field: h.field,
        oldValue: h.oldValue,
        newValue: h.newValue,
        name: nameMap.get(String(h.itemId)) || h.oldValue || undefined,
        entityName: nameMap.get(String(h.itemId)) || undefined,
      },
      createdAt: h.createdAt,
    }));
```

(Rename the local variable `denomMap` to `nameMap` everywhere it's used within this function, as shown above.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npx vitest run history.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/controllers/audit.controller.ts server/__tests__/history.controller.test.ts
git commit -m "feat: rename item name field in history feed"
```

---

## Task 7: `stats.controller.ts` and `statistics.routes.ts`

**Files:**
- Modify: `server/controllers/stats.controller.ts`
- Modify: `server/routes/statistics.routes.ts`
- Test: `server/__tests__/stats.controller.test.ts`

**Interfaces:**
- Consumes: `IItem`, `DashboardResult`, `LowStockItemResult` (Task 2).
- Produces: `getDashboardStats` response shape `{ global: { ..., cgKit, tpvKit }, suppliers, statuses, lowStockItems }`; renamed functions `getNumberOfSuppliers`, `getSuppliersList`, `getStatisticsForSupplier`, `getStatusesList`, `getStatisticsForStatus`; routes `GET /statistics/suppliers`, `/suppliers/list`, `/suppliers/:supplier`, `/statuses/list`, `/statuses/:status`.

- [ ] **Step 1: Update `server/__tests__/stats.controller.test.ts`**

This file has ~29 occurrences. Apply this mapping throughout: aggregation mock results keyed `_id: "$fournisseur"`/`_id: "$etat"` groups → assert against `supplier`/`status` grouping; `$sum:"$quantite"` mock totals stay numerically the same, just rename any object keys named `quantite` to `quantity`; response assertions `result.fournisseurs`/`result.etats` → `result.suppliers`/`result.statuses`; `result.global.prepaCG`/`.prepaTPV` → `.cgKit`/`.tpvKit`; mock `cgItems`/`tpvItems` objects `{ denomination, quantite }` → `{ name, quantity }`; legacy endpoint tests for `getFournisseursList`/`getStatisticsForFournisseur`/`getEtatsList`/`getStatisticsForEtat` — rename the imported function names to `getSuppliersList`/`getStatisticsForSupplier`/`getStatusesList`/`getStatisticsForStatus` and update `req.params.fournisseur`/`req.params.etat` mocks to `req.params.supplier`/`req.params.status`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && npx vitest run stats.controller.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `server/controllers/stats.controller.ts`**

```ts
import { Request, Response } from "express";
import ItemModel from "../models/item.model";
import { LOW_STOCK_THRESHOLD } from "../constants";
import type { DashboardResult, LowStockItemResult } from "../types/stats";

// Simple in-memory cache (invalidated on each mutation)
let statsCache: DashboardResult | null = null;
let statsCacheTime = 0;
const CACHE_TTL = 30_000; // 30 seconds

const invalidateCache = (): void => {
  statsCache = null;
  statsCacheTime = 0;
};

// Unified endpoint: all stats in a single request
export const getDashboardStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const now = Date.now();
    if (statsCache && now - statsCacheTime < CACHE_TTL) {
      res.status(200).json(statsCache);
      return;
    }

    const [
      globalStats,
      suppliersStats,
      statusesStats,
      lowStockItems,
      cgItems,
      tpvItems,
    ] = await Promise.all([
      ItemModel.aggregate([
        {
          $group: {
            _id: null,
            numberOfArticles: { $sum: 1 },
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
            },
            suppliers: { $addToSet: "$supplier" },
          },
        },
      ]),
      ItemModel.aggregate([
        {
          $group: {
            _id: "$supplier",
            numberOfArticles: { $sum: 1 },
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ItemModel.aggregate([
        {
          $group: {
            _id: "$status",
            numberOfArticles: { $sum: 1 },
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ItemModel.find({ quantity: { $lt: 5 } })
        .sort({ quantity: 1, name: 1 })
        .lean(),
      ItemModel.find({ cgKit: true }).select("name quantity").lean(),
      ItemModel.find({ tpvKit: true }).select("quantity").lean(),
    ]);

    const global = globalStats[0] || {
      numberOfArticles: 0,
      totalStock: 0,
      numberOfLowStockArticles: 0,
      suppliers: [],
    };

    // Complete CG prepa = min(qty) of each item, cassettes count qty/4
    const typedCgItems = cgItems as {
      name: string;
      quantity: number;
    }[];
    const completeCG =
      typedCgItems.length > 0
        ? Math.min(
            ...typedCgItems.map((item) => {
              const isCassette = item.name
                .toLowerCase()
                .includes("cassette");
              return isCassette ? Math.floor(item.quantity / 4) : item.quantity;
            }),
          )
        : 0;

    // Complete TPV prepa = min(qty) of each item (1 of each)
    const typedTpvItems = tpvItems as { quantity: number }[];
    const completeTPV =
      typedTpvItems.length > 0
        ? Math.min(...typedTpvItems.map((item) => item.quantity))
        : 0;

    const result: DashboardResult = {
      global: {
        numberOfArticles: global.numberOfArticles,
        totalStock: global.totalStock,
        numberOfSuppliers: global.suppliers.length,
        numberOfLowStockArticles: global.numberOfLowStockArticles,
        cgKit: completeCG,
        tpvKit: completeTPV,
      },
      suppliers: suppliersStats.map((f: Record<string, unknown>) => ({
        nom: String(f._id),
        numberOfArticles: Number(f.numberOfArticles),
        totalStock: Number(f.totalStock),
        numberOfLowStockArticles: Number(f.numberOfLowStockArticles),
      })),
      statuses: statusesStats.map((e: Record<string, unknown>) => ({
        nom: String(e._id),
        numberOfArticles: Number(e.numberOfArticles),
        totalStock: Number(e.totalStock),
        numberOfLowStockArticles: Number(e.numberOfLowStockArticles),
      })),
      lowStockItems: lowStockItems as unknown as LowStockItemResult[],
    };

    statsCache = result;
    statsCacheTime = now;

    res.status(200).json(result);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const invalidateStatsCache = invalidateCache;

// === Legacy endpoints kept for backward compatibility ===

export const getNumberOfArticles = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const numberOfArticles = await ItemModel.countDocuments();
    res.status(200).json({ numberOfArticles });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getTotalStock = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await ItemModel.aggregate([
      { $group: { _id: null, totalStock: { $sum: "$quantity" } } },
    ]);
    res.status(200).json({ totalStock: result[0]?.totalStock || 0 });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getNumberOfSuppliers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const list = await ItemModel.distinct("supplier");
    res.status(200).json({ numberOfSuppliers: list.length });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getNumberOfArticlesWithStockBelow5 = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const count = await ItemModel.countDocuments({ quantity: { $lt: 5 } });
    res.status(200).json({ numberOfLowStockArticles: count });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getArticlesWithLowStock = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const articles = await ItemModel.find({ quantity: { $lt: 5 } })
      .sort({ quantity: 1, name: 1 })
      .lean();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getSuppliersList = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const suppliersList = await ItemModel.distinct("supplier");
    res.status(200).json({ suppliersList });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getStatisticsForSupplier = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const supplier = req.params.supplier;
    const [count, stats] = await Promise.all([
      ItemModel.countDocuments({ supplier }),
      ItemModel.aggregate([
        { $match: { supplier } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
            },
          },
        },
      ]),
    ]);
    const s = stats[0] || { totalStock: 0, numberOfLowStockArticles: 0 };
    res.status(200).json({ numberOfArticles: count, ...s });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getStatusesList = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const statusesList = await ItemModel.distinct("status");
    res.status(200).json({ statusesList });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getStatisticsForStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const status = req.params.status;
    const [count, stats] = await Promise.all([
      ItemModel.countDocuments({ status }),
      ItemModel.aggregate([
        { $match: { status } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
            },
          },
        },
      ]),
    ]);
    const s = stats[0] || { totalStock: 0, numberOfLowStockArticles: 0 };
    res.status(200).json({ numberOfArticles: count, ...s });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
```

- [ ] **Step 4: Update `server/routes/statistics.routes.ts`**

```ts
import { Router } from "express";
import * as statisticsController from "../controllers/stats.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Auth middleware on all stats routes
router.use(requireAuth);

// Unified dashboard (1 request = all stats)
router.get("/dashboard", statisticsController.getDashboardStats);

// General statistics (backward compatibility)
router.get("/articles", statisticsController.getNumberOfArticles);
router.get("/stock", statisticsController.getTotalStock);
router.get("/suppliers", statisticsController.getNumberOfSuppliers);
router.get(
  "/articles/stockinf5",
  statisticsController.getNumberOfArticlesWithStockBelow5,
);
router.get("/articles/low-stock", statisticsController.getArticlesWithLowStock);

// Suppliers
router.get("/suppliers/list", statisticsController.getSuppliersList);
router.get(
  "/suppliers/:supplier",
  statisticsController.getStatisticsForSupplier,
);

// Status
router.get("/statuses/list", statisticsController.getStatusesList);
router.get("/statuses/:status", statisticsController.getStatisticsForStatus);

export default router;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd server && npx vitest run stats.controller.test.ts`
Expected: PASS

- [ ] **Step 6: Run the full backend suite**

Run: `cd server && npm test`
Expected: all tests pass, including Tasks 1–6.

- [ ] **Step 7: Commit**

```bash
git add server/controllers/stats.controller.ts server/routes/statistics.routes.ts server/__tests__/stats.controller.test.ts
git commit -m "feat: rename item fields and stats vocabulary in stats controller and routes"
```

---

## Task 8: Backend docs (`swagger.ts`, `README.md`)

**Files:**
- Modify: `server/config/swagger.ts`
- Modify: `server/README.md`

**Interfaces:** None — documentation only, no runtime behavior, no tests.

- [ ] **Step 1: Update `server/config/swagger.ts`**

Grep for each old term and replace: `denomination→name`, `quantite→quantity`, `fournisseur→supplier`, `etat→status`, `prepaCG→cgKit`, `prepaTPV→tpvKit` in the item schema `properties` block, the `readItem`/`createItem`/`updateItem` query/body param definitions, the `prepa-batch` enum (`["prepaCG","prepaTPV"]→["cgKit","tpvKit"]`), and the stats path definitions (`/statistics/fournisseurs/{fournisseur}→/statistics/suppliers/{supplier}`, `/statistics/etats/{etat}→/statistics/statuses/{status}`, including their `parameters` name fields).

Run: `cd server && grep -n "denomination\|quantite\|fournisseur\|etat\b\|prepaCG\|prepaTPV" config/swagger.ts` before and after to confirm every occurrence was caught (expect zero matches after, aside from unrelated words that happen to contain "etat" as a substring — inspect each hit).

- [ ] **Step 2: Update `server/README.md`**

Grep for the same terms and update documented field names, example request/response JSON bodies, and route paths to match.

Run: `cd server && grep -n "denomination\|quantite\|fournisseur\|prepaCG\|prepaTPV" README.md` to confirm.

- [ ] **Step 3: Verify the backend compiles clean**

Run: `cd server && npx tsc --noEmit`
Expected: no errors (this confirms Tasks 2–8 fully closed out every backend reference).

- [ ] **Step 4: Commit**

```bash
git add server/config/swagger.ts server/README.md
git commit -m "docs: update API docs with renamed item fields"
```

---

## Task 9: Angular shared models and utils

**Files:**
- Modify: `client-ng/src/app/shared/models/item.model.ts`
- Modify: `client-ng/src/app/shared/models/statistics.model.ts`
- Modify: `client-ng/src/app/shared/utils/prepa-filter.utils.ts`
- Modify: `client-ng/src/app/shared/utils/export.utils.ts`
- Test: `client-ng/src/app/shared/utils/__tests__/export.utils.spec.ts`

**Interfaces:**
- Produces: `Item { ..., name, quantity, supplier, status, cgKit?, tpvKit? }`; `NewItem`/`FetchItemsParams` same rename (`FetchItemsParams.supplier?: string[]`, `.status?: string[]`, `.cgKit?`, `.tpvKit?`); `GlobalStatistics.cgKit?/tpvKit?`; `LowStockItem { name, supplier, status, quantity }`; `DashboardStats.suppliers` (renamed from `.fournisseurs`); `PrepaFilterState { cgKit, tpvKit }`, `togglePrepaFilter` unchanged signature/logic.
- Consumed by: Tasks 10–11 (every items/home/history file imports `Item`, `FetchItemsParams`, or these utils).

- [ ] **Step 1: Update `client-ng/src/app/shared/utils/__tests__/export.utils.spec.ts`**

Rewrite mock `Item[]` fixtures used in this spec: `denomination→name`, `fournisseur→supplier`, `etat→status`, `quantite→quantity`, `prepaCG→cgKit`, `prepaTPV→tpvKit`. Leave every assertion about the exported CSV/PDF/XLSX **header text** (`'Dénomination'`, `'Fournisseur'`, `'État'`, `'Quantité'`, `'Prépa CG'`, `'Prépa TPV'`, `'Oui'/'Non'`) untouched — those are out of scope.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client-ng && npx vitest run shared/utils/__tests__/export.utils.spec.ts`
Expected: FAIL — type errors / mismatched fixture keys.

- [ ] **Step 3: Update `client-ng/src/app/shared/models/item.model.ts`**

```ts
export interface Item {
  _id: string;
  posterId: string;
  modifierName?: string;
  name: string;
  quantity: number;
  supplier: string;
  image?: string;
  status: string;
  cgKit?: boolean;
  tpvKit?: boolean;
  preparation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewItem {
  name: string;
  supplier: string;
  quantity: number;
  status: string;
  posterId: string;
  modifierId?: string;
  modifierName?: string;
  cgKit?: boolean;
  tpvKit?: boolean;
}

export interface FetchItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  supplier?: string[];
  status?: string[];
  cgKit?: boolean;
  tpvKit?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ItemHistory {
  _id: string;
  itemId: string;
  action: 'create' | 'update' | 'delete' | 'quantity_change';
  field?: string;
  oldValue?: string;
  newValue?: string;
  userName: string;
  createdAt: string;
}
```

- [ ] **Step 4: Update `client-ng/src/app/shared/models/statistics.model.ts`**

```ts
export interface GlobalStatistics {
  numberOfArticles: number;
  totalStock: number;
  numberOfSuppliers: number;
  numberOfLowStockArticles: number;
  cgKit?: number;
  tpvKit?: number;
}

export interface FournisseurStats {
  numberOfArticles: number;
  totalStock: number;
  numberOfLowStockArticles: number;
  nom?: string;
}

export interface LowStockItem {
  _id: string;
  name: string;
  supplier: string;
  status: string;
  quantity: number;
}

export interface DashboardStats {
  global: GlobalStatistics;
  suppliers: FournisseurStats[];
  lowStockItems: LowStockItem[];
}
```

(`FournisseurStats` and its `nom` field are intentionally left as-is — out of the confirmed rename scope, matches backend `SupplierOrStateStats.nom` which was also left alone in Task 2.)

- [ ] **Step 5: Update `client-ng/src/app/shared/utils/prepa-filter.utils.ts`**

```ts
export interface PrepaFilterState {
  cgKit: boolean;
  tpvKit: boolean;
}

export function togglePrepaFilter(
  current: PrepaFilterState,
  prepa: 'CashGuard' | 'Caisse TPV',
): PrepaFilterState {
  const isCashGuard = prepa === 'CashGuard';
  const wasActive = isCashGuard ? current.cgKit : current.tpvKit;
  return {
    cgKit: isCashGuard ? !wasActive : false,
    tpvKit: isCashGuard ? false : !wasActive,
  };
}
```

- [ ] **Step 6: Update `client-ng/src/app/shared/utils/export.utils.ts`**

Change only the object-key reads (`item.denomination→item.name`, `item.fournisseur→item.supplier`, `item.etat→item.status`, `item.quantite→item.quantity`, `item.prepaCG→item.cgKit`, `item.prepaTPV→item.tpvKit`) in all four export functions (`exportItemsToCSV`, `exportItemsToXLSX`, `exportItemsToPDF`, `exportItemsToJSON`). Do **not** change the French header strings/object keys (`'Dénomination'`, `Fournisseur:`, `État:`, etc.) — those stay French display labels, only what reads from `item.*` changes:

```ts
import { Item } from '../models/item.model';
import { downloadBlob } from './download.utils';

export function exportItemsToCSV(items: Item[]): void {
  const headers = ['Dénomination', 'Fournisseur', 'État', 'Quantité', 'Prépa CG', 'Prépa TPV'];
  const rows = items.map((item) => [
    item.name,
    item.supplier,
    item.status,
    String(item.quantity),
    item.cgKit ? 'Oui' : 'Non',
    item.tpvKit ? 'Oui' : 'Non',
  ]);

  const csvContent =
    '﻿' +
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportItemsToXLSX(items: Item[]): Promise<void> {
  const { utils, writeFile } = await import('@e965/xlsx');
  const data = items.map((item) => ({
    Dénomination: item.name,
    Fournisseur: item.supplier,
    État: item.status,
    Quantité: item.quantity,
    'Prépa CG': item.cgKit ? 'Oui' : 'Non',
    'Prépa TPV': item.tpvKit ? 'Oui' : 'Non',
  }));
  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Stock');
  writeFile(wb, `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportItemsToPDF(items: Item[]): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14);
  doc.text('Stock Anamarcol', 14, 16);
  doc.setFontSize(10);
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 23);

  autoTable(doc, {
    startY: 28,
    head: [['Dénomination', 'Fournisseur', 'État', 'Quantité', 'Prépa CG', 'Prépa TPV']],
    body: items.map((item) => [
      item.name,
      item.supplier,
      item.status,
      item.quantity,
      item.cgKit ? 'Oui' : 'Non',
      item.tpvKit ? 'Oui' : 'Non',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 74, 42] },
  });

  doc.save(`stock-anamarcol-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportItemsToJSON(items: Item[]): void {
  const json = JSON.stringify(items, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `stock-anamarcol-${new Date().toISOString().slice(0, 10)}.json`);
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd client-ng && npx vitest run shared/utils/__tests__/export.utils.spec.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add client-ng/src/app/shared/models/item.model.ts client-ng/src/app/shared/models/statistics.model.ts client-ng/src/app/shared/utils/prepa-filter.utils.ts client-ng/src/app/shared/utils/export.utils.ts client-ng/src/app/shared/utils/__tests__/export.utils.spec.ts
git commit -m "feat: rename item fields in Angular shared models and export utils"
```

---

## Task 10: Angular items store (actions, effects, facade, reducer, selectors)

**Files:**
- Modify: `client-ng/src/app/features/items/store/items.actions.ts`
- Modify: `client-ng/src/app/features/items/store/items.effects.ts`
- Modify: `client-ng/src/app/features/items/store/items.facade.ts`
- Modify: `client-ng/src/app/features/items/store/items.reducer.ts`
- Modify: `client-ng/src/app/features/items/store/items.selectors.ts` (verify field-name dependence; likely no change needed — check before editing)
- Test: `client-ng/src/app/features/items/store/__tests__/items.reducer.spec.ts`, `items.effects.spec.ts`, `items.selectors.spec.ts`

**Interfaces:**
- Consumes: `Item`, `NewItem`, `FetchItemsParams` (Task 9).
- Produces: `ItemsActions.updateQuantity` / `.updateQuantitySuccess` / `.updateQuantityFailure` (renamed from `updateQuantite*`, both the TS symbol AND the NgRx action-type string `'Update Quantity'` etc.); `ItemsFacade.updateQuantity(id, quantity, modifierName, operation)`.

- [ ] **Step 1: Update the three spec files**

Rewrite mock `Item`/`NewItem`/`FetchItemsParams` fixtures (`denomination→name`, etc.) and any dispatched-action assertions referencing `ItemsActions.updateQuantite`/`updateQuantiteSuccess`/`updateQuantiteFailure` or their payload key `quantite` — rename to `updateQuantity`/`updateQuantitySuccess`/`updateQuantityFailure` and payload key `quantity`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client-ng && npx vitest run features/items/store/__tests__`
Expected: FAIL.

- [ ] **Step 3: Update `client-ng/src/app/features/items/store/items.actions.ts`**

```ts
import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { FetchItemsParams, Item, ItemHistory, NewItem } from '../../../shared/models/item.model';

export const ItemsActions = createActionGroup({
  source: 'Items',
  events: {
    'Load All Items': emptyProps(),
    'Load All Items Success': props<{ items: Item[] }>(),
    'Load All Items Failure': props<{ error: string }>(),

    'Fetch Items': props<{ params: FetchItemsParams }>(),
    'Fetch Items Success': props<{
      items: Item[];
      total: number;
      page: number;
      totalPages: number;
      canDecrement: Record<string, boolean>;
    }>(),
    'Fetch Items Failure': props<{ error: string }>(),

    'Create Item': props<{ data: NewItem }>(),
    'Create Item Success': props<{ item: Item }>(),
    'Create Item Failure': props<{ error: string }>(),

    'Update Item': props<{ id: string; data: Partial<Item> }>(),
    'Update Item Success': props<{ item: Item }>(),
    'Update Item Failure': props<{ error: string }>(),

    'Delete Item': props<{ id: string }>(),
    'Delete Item Success': props<{ id: string }>(),
    'Delete Item Failure': props<{ error: string }>(),

    'Update Quantity': props<{
      id: string;
      quantity: number;
      modifierName: string;
      operation: 'add' | 'subtract';
    }>(),
    'Update Quantity Success': props<{ id: string; quantity: number }>(),
    'Update Quantity Failure': props<{ error: string }>(),

    'Upload Item Picture': props<{ id: string; formData: FormData }>(),
    'Upload Item Picture Success': props<{ item: Item }>(),
    'Upload Item Picture Failure': props<{ error: string }>(),

    'Prepa Batch': props<{
      field: string;
      operation: string;
      count: number;
      params: FetchItemsParams;
    }>(),
    'Prepa Batch Success': emptyProps(),

    'Set Selected Item Id': props<{ id: string | null }>(),
    'Load Item History': props<{ id: string }>(),
    'Load Item History Success': props<{ history: ItemHistory[] }>(),
  },
});
```

- [ ] **Step 4: Update `client-ng/src/app/features/items/store/items.effects.ts`**

```ts
import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, switchMap } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../core/http/api.service';
import { ToastService } from '../../../core/toast/toast.service';
import { Item, ItemHistory } from '../../../shared/models/item.model';
import { ItemsActions } from './items.actions';

interface PaginatedItems {
  items: Item[];
  total: number;
  page: number;
  totalPages: number;
  canDecrement: Record<string, boolean>;
}

@Injectable()
export class ItemsEffects {
  private actions$ = inject(Actions);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loadAllItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.loadAllItems),
      exhaustMap(() =>
        this.api.get<PaginatedItems | Item[]>('api/item/', { limit: '9999' }).pipe(
          map((response) => {
            const items = Array.isArray(response) ? response : (response.items ?? []);
            return ItemsActions.loadAllItemsSuccess({ items });
          }),
          catchError((error) =>
            of(ItemsActions.loadAllItemsFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  fetchItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.fetchItems),
      switchMap(({ params }) => {
        const queryParams: Record<string, string> = {};
        if (params.page) queryParams['page'] = String(params.page);
        if (params.limit) queryParams['limit'] = String(params.limit);
        if (params.search) queryParams['search'] = params.search;
        if (params.supplier?.length) queryParams['supplier'] = params.supplier.join(',');
        if (params.status?.length) queryParams['status'] = params.status.join(',');
        if (params.cgKit) queryParams['cgKit'] = 'true';
        if (params.tpvKit) queryParams['tpvKit'] = 'true';
        if (params.sortBy) queryParams['sortBy'] = params.sortBy;
        if (params.sortOrder) queryParams['sortOrder'] = params.sortOrder;

        return this.api.get<PaginatedItems>('api/item/', queryParams).pipe(
          map((response) =>
            ItemsActions.fetchItemsSuccess({
              items: response.items ?? [],
              total: response.total ?? 0,
              page: response.page ?? 1,
              totalPages: response.totalPages ?? 0,
              canDecrement: response.canDecrement ?? {},
            }),
          ),
          catchError((error) =>
            of(ItemsActions.fetchItemsFailure({ error: error?.message ?? 'Erreur' })),
          ),
        );
      }),
    ),
  );

  createItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.createItem),
      exhaustMap(({ data }) =>
        this.api.post<{ item: Item }>('api/item/', data).pipe(
          map((response) => {
            this.toast.success('TOAST.ITEM_ADDED');
            return ItemsActions.createItemSuccess({ item: response.item });
          }),
          catchError((error) => {
            this.toast.error('TOAST.ITEM_ADD_ERROR');
            return of(ItemsActions.createItemFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  updateItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.updateItem),
      exhaustMap(({ id, data }) =>
        this.api.put<{ item: Item }>(`api/item/${id}`, data).pipe(
          map((response) => {
            this.toast.success('TOAST.ITEM_UPDATED');
            return ItemsActions.updateItemSuccess({ item: response.item });
          }),
          catchError((error) => {
            this.toast.error('TOAST.ITEM_UPDATE_ERROR');
            return of(ItemsActions.updateItemFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  deleteItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.deleteItem),
      exhaustMap(({ id }) =>
        this.api.delete<void>(`api/item/${id}`).pipe(
          map(() => {
            this.toast.success('TOAST.ITEM_DELETED');
            return ItemsActions.deleteItemSuccess({ id });
          }),
          catchError((error) => {
            this.toast.error('TOAST.ITEM_DELETE_ERROR');
            return of(ItemsActions.deleteItemFailure({ error: error?.message ?? 'Erreur' }));
          }),
        ),
      ),
    ),
  );

  updateQuantity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.updateQuantity),
      exhaustMap(({ id, quantity, modifierName, operation }) =>
        this.api.put<{ item: Item }>(`api/item/${id}`, { quantity, modifierName, operation }).pipe(
          map((response) => {
            this.toast.success('TOAST.ITEM_QTY_UPDATED');
            return ItemsActions.updateQuantitySuccess({ id, quantity: response.item.quantity });
          }),
          catchError((error) =>
            of(ItemsActions.updateQuantityFailure({ error: error?.message ?? 'Erreur' })),
          ),
        ),
      ),
    ),
  );

  uploadPicture$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.uploadItemPicture),
      exhaustMap(({ id, formData }) => {
        formData.append('itemId', id);
        return this.api.postFormData<Item>('api/item/upload', formData).pipe(
          map((item) => {
            this.toast.success('TOAST.ITEM_IMAGE_UPDATED');
            return ItemsActions.uploadItemPictureSuccess({ item });
          }),
          catchError((error) => {
            this.toast.error('TOAST.ITEM_IMAGE_ERROR');
            return of(ItemsActions.uploadItemPictureFailure({ error: error?.message ?? 'Erreur' }));
          }),
        );
      }),
    ),
  );

  prepaBatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.prepaBatch),
      exhaustMap(({ field, operation, count, params }) =>
        this.api
          .post<{ updated: number; message: string }>('api/item/prepa-batch', {
            prepa: field,
            operation,
            count,
          })
          .pipe(
            switchMap((response) => {
              const key =
                field === 'cgKit'
                  ? operation === 'increment'
                    ? 'ITEMS.PREPA_BATCH_CG_INCREMENTED'
                    : 'ITEMS.PREPA_BATCH_CG_DECREMENTED'
                  : operation === 'increment'
                    ? 'ITEMS.PREPA_BATCH_TPV_INCREMENTED'
                    : 'ITEMS.PREPA_BATCH_TPV_DECREMENTED';
              this.toast.success(key, { count: response.updated });
              return of(ItemsActions.prepaBatchSuccess(), ItemsActions.fetchItems({ params }));
            }),
            catchError(() => {
              this.toast.error('TOAST.ITEM_BATCH_ERROR');
              return of(ItemsActions.prepaBatchSuccess());
            }),
          ),
      ),
    ),
  );

  loadHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ItemsActions.loadItemHistory),
      switchMap(({ id }) =>
        this.api.get<ItemHistory[]>(`api/item/history/${id}`).pipe(
          map((history) => ItemsActions.loadItemHistorySuccess({ history })),
          catchError(() => of(ItemsActions.loadItemHistorySuccess({ history: [] }))),
        ),
      ),
    ),
  );
}
```

- [ ] **Step 5: Update `client-ng/src/app/features/items/store/items.facade.ts`**

```ts
import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, map } from 'rxjs';
import { FetchItemsParams, Item, NewItem } from '../../../shared/models/item.model';
import { ItemsActions } from './items.actions';
import {
  selectAllItems,
  selectCanDecrement,
  selectHistory,
  selectIsLoadingHistory,
  selectItemsLoaded,
  selectItemsLoading,
  selectPage,
  selectPageItems,
  selectSelectedItem,
  selectSelectedItemId,
  selectTotal,
  selectTotalPages,
} from './items.selectors';

@Injectable({ providedIn: 'root' })
export class ItemsFacade {
  private store = inject(Store);

  allItems$ = this.store.select(selectAllItems);
  items$ = this.store.select(selectPageItems);
  total$ = this.store.select(selectTotal);
  page$ = this.store.select(selectPage);
  totalPages$ = this.store.select(selectTotalPages);
  isLoading$ = combineLatest([
    this.store.select(selectItemsLoading),
    this.store.select(selectItemsLoaded),
  ]).pipe(map(([loading, loaded]) => loading && !loaded));
  selectedItemId$ = this.store.select(selectSelectedItemId);
  selectedItem$ = this.store.select(selectSelectedItem);
  canDecrement$ = this.store.select(selectCanDecrement);
  history$ = this.store.select(selectHistory);
  isLoadingHistory$ = this.store.select(selectIsLoadingHistory);

  loadAllItems() {
    this.store.dispatch(ItemsActions.loadAllItems());
  }
  fetchItems(params: FetchItemsParams = {}) {
    this.store.dispatch(ItemsActions.fetchItems({ params }));
  }
  createItem(data: NewItem) {
    this.store.dispatch(ItemsActions.createItem({ data }));
  }
  updateItem(id: string, data: Partial<Item>) {
    this.store.dispatch(ItemsActions.updateItem({ id, data }));
  }
  deleteItem(id: string) {
    this.store.dispatch(ItemsActions.deleteItem({ id }));
  }
  updateQuantity(
    id: string,
    quantity: number,
    modifierName: string,
    operation: 'add' | 'subtract',
  ) {
    this.store.dispatch(ItemsActions.updateQuantity({ id, quantity, modifierName, operation }));
  }
  uploadPicture(id: string, formData: FormData) {
    this.store.dispatch(ItemsActions.uploadItemPicture({ id, formData }));
  }
  setSelectedItemId(id: string | null) {
    this.store.dispatch(ItemsActions.setSelectedItemId({ id }));
  }
  prepaBatch(
    field: string,
    operation: 'increment' | 'decrement',
    count: number,
    params: FetchItemsParams,
  ) {
    this.store.dispatch(ItemsActions.prepaBatch({ field, operation, count, params }));
  }
  loadHistory(id: string) {
    this.store.dispatch(ItemsActions.loadItemHistory({ id }));
  }
}
```

- [ ] **Step 6: Update `client-ng/src/app/features/items/store/items.reducer.ts`**

```ts
import { createReducer, on } from '@ngrx/store';
import { ItemsActions } from './items.actions';
import { initialItemsState } from './items.state';

export const itemsReducer = createReducer(
  initialItemsState,

  on(ItemsActions.loadAllItems, (state) => ({ ...state, isLoading: true })),
  on(ItemsActions.loadAllItemsSuccess, (state, { items }) => ({
    ...state,
    allItems: items,
    loaded: true,
    isLoading: false,
  })),
  on(ItemsActions.loadAllItemsFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(ItemsActions.fetchItems, (state) => ({ ...state, isLoading: true })),
  on(ItemsActions.fetchItemsSuccess, (state, { items, total, page, totalPages, canDecrement }) => ({
    ...state,
    items,
    total,
    page,
    totalPages,
    canDecrement,
    isLoading: false,
    error: null,
  })),
  on(ItemsActions.fetchItemsFailure, (state, { error }) => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(ItemsActions.createItemSuccess, (state, { item }) => ({
    ...state,
    allItems: [item, ...state.allItems],
  })),

  on(ItemsActions.updateItemSuccess, (state, { item }) => ({
    ...state,
    items: state.items.map((existing) => (existing._id === item._id ? item : existing)),
    allItems: state.allItems.map((existing) => (existing._id === item._id ? item : existing)),
  })),

  on(ItemsActions.deleteItemSuccess, (state, { id }) => ({
    ...state,
    items: state.items.filter((existing) => existing._id !== id),
    allItems: state.allItems.filter((existing) => existing._id !== id),
    total: state.total - 1,
  })),

  on(ItemsActions.updateQuantitySuccess, (state, { id, quantity }) => ({
    ...state,
    items: state.items.map((existing) =>
      existing._id === id ? { ...existing, quantity } : existing,
    ),
    allItems: state.allItems.map((existing) =>
      existing._id === id ? { ...existing, quantity } : existing,
    ),
  })),

  on(ItemsActions.uploadItemPictureSuccess, (state, { item }) => ({
    ...state,
    items: state.items.map((existing) => (existing._id === item._id ? item : existing)),
    allItems: state.allItems.map((existing) => (existing._id === item._id ? item : existing)),
  })),
  on(ItemsActions.uploadItemPictureFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(ItemsActions.setSelectedItemId, (state, { id }) => ({
    ...state,
    selectedItemId: id,
  })),

  on(ItemsActions.loadItemHistory, (state) => ({ ...state, isLoadingHistory: true, history: [] })),
  on(ItemsActions.loadItemHistorySuccess, (state, { history }) => ({
    ...state,
    history,
    isLoadingHistory: false,
  })),
);
```

- [ ] **Step 7: Check `items.selectors.ts` for field-name dependence**

Open `client-ng/src/app/features/items/store/items.selectors.ts`. If any selector sorts, filters, or maps on `denomination`/`quantite`/`fournisseur`/`etat`/`prepaCG`/`prepaTPV` directly, apply the same rename. If it only selects whole `Item` objects or state slices (no field-name literals), no change needed — confirm and move on.

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd client-ng && npx vitest run features/items/store/__tests__`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add client-ng/src/app/features/items/store/
git commit -m "feat: rename item fields in Angular items store"
```

---

## Task 11: Angular UI components, home/stats, and history page

**Files:**
- Modify: `client-ng/src/app/features/items/items-page.ts` (+ `.html`)
- Modify: `client-ng/src/app/features/items/components/item-card/item-card.ts` (+ `.html`)
- Modify: `client-ng/src/app/features/items/components/filters-modal/filters-modal.ts` (+ `.html`, `.scss`)
- Modify: `client-ng/src/app/features/items/components/edit-item-modal/edit-item-modal.ts` (+ `.html`)
- Modify: `client-ng/src/app/features/items/components/add-item-modal/add-item-modal.ts` (+ `.html`)
- Modify: `client-ng/src/app/features/items/components/export-modal/export-modal.ts` (only if it references field names directly — check first)
- Modify: `client-ng/src/app/features/home/store/statistics.selectors.ts`
- Modify: `client-ng/src/app/features/home/store/statistics.facade.ts` (only if it references field names directly — check first)
- Modify: `client-ng/src/app/features/home/home-page.html`
- Modify: `client-ng/src/app/features/home/components/low-stock-table/low-stock-table.ts` (+ `.html`)
- Modify: `client-ng/src/app/features/home/components/kpi-grid/kpi-grid.html`
- Modify: `client-ng/src/app/features/history/history-page.ts`
- Test: `client-ng/src/app/features/items/components/filters-modal/__tests__/filters-modal.spec.ts`, `add-item-modal/__tests__/add-item-modal.spec.ts`, `client-ng/src/app/features/items/__tests__/items-page.spec.ts`

**Interfaces:**
- Consumes: `Item`, `NewItem`, `FetchItemsParams` (Task 9), `ItemsFacade.updateQuantity` (Task 10), `DashboardStats`/`GlobalStatistics`/`LowStockItem` (Task 9), `getHistory` response `details.name` (backend Task 6).

**Rename table to apply everywhere in this task (TypeScript property access AND template bindings):**

| Old | New |
|---|---|
| `.denomination` | `.name` |
| `.quantite` | `.quantity` |
| `.fournisseur` | `.supplier` |
| `.etat` | `.status` |
| `.prepaCG` | `.cgKit` |
| `.prepaTPV` | `.tpvKit` |

Reactive form control names (`this.form.get('denomination')`, form group keys, etc.) also rename — they are code identifiers, not i18n keys. The i18n translation keys used as labels (`'ITEMS.DENOMINATION' | translate`, etc.) stay exactly as they are — do not touch any string starting with `ITEMS.`, `HOME.`, or `HISTORY.`.

- [ ] **Step 1: Update the two component specs first**

`filters-modal.spec.ts` and `add-item-modal.spec.ts`: rewrite mock `Item`/`NewItem`/`FetchItemsParams` fixtures and any assertions on emitted filter/form values using the rename table above.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client-ng && npx vitest run features/items/components/filters-modal features/items/components/add-item-modal`
Expected: FAIL.

- [ ] **Step 3: Worked example — `item-card.ts` / `item-card.html`**

Open both files. Every template binding and TS property read of the six fields gets renamed per the table above. For example, a template line like:

```html
<h3>{{ item.denomination }}</h3>
<p>{{ item.fournisseur }} — {{ item.etat }}</p>
<span class="qty">{{ item.quantite }}</span>
@if (item.prepaCG) { <span class="badge">CG</span> }
@if (item.prepaTPV) { <span class="badge">TPV</span> }
```

becomes:

```html
<h3>{{ item.name }}</h3>
<p>{{ item.supplier }} — {{ item.status }}</p>
<span class="qty">{{ item.quantity }}</span>
@if (item.cgKit) { <span class="badge">CG</span> }
@if (item.tpvKit) { <span class="badge">TPV</span> }
```

(This is illustrative of the pattern — read the actual current file content before editing, since exact markup may differ; the field-name substitutions are what matters, not this exact HTML structure.)

- [ ] **Step 4: Apply the same rename table to the remaining files**

For each file in the Files list above (`items-page.ts/.html`, `filters-modal.ts/.html/.scss`, `edit-item-modal.ts/.html`, `add-item-modal.ts/.html`, `export-modal.ts` if applicable, `statistics.selectors.ts`, `statistics.facade.ts` if applicable, `home-page.html`, `low-stock-table.ts/.html`, `kpi-grid.html`): open the file, find every occurrence of the six old field names as property accesses or form-control/filter-state keys, and rename per the table. Skip any occurrence that is inside a string starting with `ITEMS.`/`HOME.`/`HISTORY.` (i18n key) or inside `export.utils.ts`-style French display text (not expected in these files, but if found, leave it).

For `statistics.selectors.ts` specifically: `state.dashboard?.fournisseurs` → `state.dashboard?.suppliers`.

For `low-stock-table.ts`/`.html` specifically: any `item.etat === tab` tab-filter comparison → `item.status === tab`.

For `kpi-grid.html` specifically: `prepaCG`/`prepaTPV` KPI value bindings → `cgKit`/`tpvKit`.

- [ ] **Step 5: Update `client-ng/src/app/features/history/history-page.ts`**

In `isQuantityOnlyUpdate`, change both `field === 'quantite'` checks to `field === 'quantity'` (the `field === 'quantity'` half already exists — remove the now-redundant `'quantite'` OR-branch, keeping only `'quantity'`):

```ts
function isQuantityOnlyUpdate(event: AuditEvent): boolean {
  if (event.action !== 'update') return false;
  if (event.details?.['field']) {
    const field = String(event.details['field']).toLowerCase();
    return field === 'quantity';
  }
  if (event.details?.['changes'] && typeof event.details['changes'] === 'object') {
    const fields = Object.keys(event.details['changes'] as Record<string, unknown>);
    return (
      fields.length > 0 &&
      fields.every((fieldName) => String(fieldName).toLowerCase() === 'quantity')
    );
  }
  return false;
}
```

And in `describeEvent`, change `event.details?.['denomination']` to `event.details?.['name']`:

```ts
    const entityName =
      (event.details?.['entityName'] as string | undefined) ??
      (event.details?.['name'] as string | undefined);
```

- [ ] **Step 6: Run the two component tests plus items-page spec**

Run: `cd client-ng && npx vitest run features/items/components/filters-modal features/items/components/add-item-modal features/items/__tests__/items-page.spec.ts`
Expected: PASS.

- [ ] **Step 7: Full Angular type-check**

Run: `cd client-ng && npx tsc --noEmit -p tsconfig.app.json`
Expected: zero errors. Any remaining error names the exact file/line still using an old field name — fix it and re-run until clean. This is the authoritative completeness check for this task given the file count.

- [ ] **Step 8: Run the full Angular test suite**

Run: `cd client-ng && npm test`
Expected: all specs pass.

- [ ] **Step 9: Commit**

```bash
git add client-ng/src/app/features/items/ client-ng/src/app/features/home/ client-ng/src/app/features/history/
git commit -m "feat: rename item fields across Angular items, home, and history UI"
```

---

## Task 12: React (client/) types, actions, and reducers

**Files:**
- Modify: `client/src/types/item.ts`
- Modify: `client/src/types/statistics.ts`
- Modify: `client/src/actions/items.actions.ts`
- Modify: `client/src/actions/item.actions.ts`
- Modify: `client/src/actions/statistics.actions.ts`
- Modify: `client/src/reducers/items.reducer.ts`
- Modify: `client/src/reducers/item.reducer.ts`
- Modify: `client/src/reducers/statistics.reducer.ts`
- Test: `client/src/reducers/__tests__/items.reducer.test.ts`

**Interfaces:**
- Produces: `Item { ..., name, quantity, supplier, status, cgKit?, tpvKit? }` (matching Angular's `Item` from Task 9), same rename applied to `NewItem`/`FetchItemsParams`/`History`.

- [ ] **Step 1: Update `client/src/reducers/__tests__/items.reducer.test.ts`**

Rewrite mock `Item[]` state and dispatched-action payloads using the field mapping (`denomination→name`, `quantite→quantity`, `fournisseur→supplier`, `etat→status`, `prepaCG→cgKit`, `prepaTPV→tpvKit`).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && npx vitest run src/reducers/__tests__/items.reducer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `client/src/types/item.ts`**

```ts
export interface Item {
  _id: string;
  posterId: string;
  modifierName?: string;
  name: string;
  quantity: number;
  supplier: string;
  image?: string;
  status: string;
  cgKit?: boolean;
  tpvKit?: boolean;
  preparation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewItem {
  name: string;
  supplier: string;
  quantity: number;
  status: string;
  posterId: string;
  modifierId?: string;
  modifierName?: string;
}

export interface FetchItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  supplier?: string[];
  status?: string[];
  cgKit?: boolean;
  tpvKit?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface History {
  _id: string;
  itemId: string;
  action: "create" | "update" | "delete" | "quantity_change";
  field?: string;
  oldValue?: string;
  newValue?: string;
  userName: string;
  createdAt: string;
}
```

- [ ] **Step 4: Update `client/src/types/statistics.ts`**

Read the current file (not yet inspected in this planning pass) and apply the same rename table used in Task 9's `statistics.model.ts` (`fournisseurs→suppliers`, `prepaCG/prepaTPV→cgKit/tpvKit`, `denomination/fournisseur/etat/quantite→name/supplier/status/quantity` on any low-stock-item shape). Match the Angular equivalent's final shape exactly since both frontends consume the same backend response.

- [ ] **Step 5: Update `client/src/actions/items.actions.ts`**

```ts
import axios from "axios";
import type { AppDispatch, FetchItemsParams } from "../types";

export const GET_ALL_ITEMS = "GET_ALL_ITEMS";
export const FETCH_ITEMS_REQUEST = "FETCH_ITEMS_REQUEST";
export const FETCH_ITEMS_SUCCESS = "FETCH_ITEMS_SUCCESS";
export const FETCH_ITEMS_FAILURE = "FETCH_ITEMS_FAILURE";

// Loads ALL items (used by stats, etc.)
export const getAllItems = () => {
  return (dispatch: AppDispatch) => {
    return axios
      .get(`${import.meta.env.VITE_API_URL}api/item/?limit=9999`)
      .then((res) => {
        const data = res.data;
        const items = Array.isArray(data) ? data : data.items || [];
        dispatch({ type: GET_ALL_ITEMS, payload: items });
      })
      .catch((err) => console.error(err));
  };
};

// Loads items with pagination and server-side filters
export const fetchItems = (params: FetchItemsParams = {}) => {
  return async (dispatch: AppDispatch) => {
    dispatch({ type: FETCH_ITEMS_REQUEST });

    try {
      const q = new URLSearchParams();
      if (params.page) q.append("page", params.page.toString());
      if (params.limit) q.append("limit", params.limit.toString());
      if (params.search) q.append("search", params.search);
      if (params.supplier?.length)
        q.append("supplier", params.supplier.join(","));
      if (params.status?.length) q.append("status", params.status.join(","));
      if (params.cgKit) q.append("cgKit", "true");
      if (params.tpvKit) q.append("tpvKit", "true");
      if (params.sortBy) q.append("sortBy", params.sortBy);
      if (params.sortOrder) q.append("sortOrder", params.sortOrder);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}api/item/?${q.toString()}`,
      );

      dispatch({ type: FETCH_ITEMS_SUCCESS, payload: res.data });
    } catch (err) {
      console.error(err);
      dispatch({ type: FETCH_ITEMS_FAILURE });
    }
  };
};
```

- [ ] **Step 6: Update `client/src/actions/item.actions.ts`**

Read the current file. Apply the same rename table to any create/update/delete/prepa-batch/quantity-update action creators (mirroring the Angular effects in Task 10 — look specifically for a quantity-update action analogous to Angular's `updateQuantite`/`updateQuantity`, and for the `prepa`/`prepaCG`/`prepaTPV` literal used in a prepa-batch call, renaming to `cgKit`/`tpvKit` to match the backend's Task 5 `prepaBatch` contract).

- [ ] **Step 7: Update `client/src/actions/statistics.actions.ts`**

Read the current file and rename any field references in the dispatched payload shape to match `client/src/types/statistics.ts` from Step 4.

- [ ] **Step 8: Update `client/src/reducers/items.reducer.ts` and `client/src/reducers/item.reducer.ts`**

Read both files and rename state fields/action payload destructuring per the table (mirroring Angular's `items.reducer.ts` from Task 10 — same `existing.quantite→quantity` pattern in any quantity-update case).

- [ ] **Step 9: Update `client/src/reducers/statistics.reducer.ts`**

Read the file and rename `fournisseurs→suppliers` and any `prepaCG/prepaTPV→cgKit/tpvKit` references in the reducer state shape.

- [ ] **Step 10: Run test to verify it passes**

Run: `cd client && npx vitest run src/reducers/__tests__/items.reducer.test.ts`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add client/src/types/ client/src/actions/ client/src/reducers/
git commit -m "feat: rename item fields in React types, actions, and reducers"
```

---

## Task 13: React (client/) pages, components, and export utils

**Files:**
- Modify: `client/src/pages/articles/articles.tsx`
- Modify: `client/src/pages/home/home.tsx`
- Modify: `client/src/pages/history/history.tsx`
- Modify: `client/src/components/Modales/ItemModale.tsx`
- Modify: `client/src/components/Modales/AddModale.tsx`
- Modify: `client/src/components/Modales/FiltersModal.tsx`
- Modify: `client/src/components/Stats/Statistics.tsx`
- Modify: `client/src/utils/export.utils.ts`
- Modify: `client/src/utils/csv.utils.ts`
- Test: `client/src/utils/__tests__/export.utils.test.ts`, `client/src/utils/__tests__/csv.utils.test.ts`

**Interfaces:**
- Consumes: `Item`, `NewItem`, `FetchItemsParams` (Task 12), history feed `details.name` (backend Task 6).

**Rename table** — identical to Task 11's table (`.denomination→.name`, `.quantite→.quantity`, `.fournisseur→.supplier`, `.etat→.status`, `.prepaCG→.cgKit`, `.prepaTPV→.tpvKit`). Same out-of-scope carve-out: French display labels/headers in `export.utils.ts`/`csv.utils.ts` stay French, only the underlying `item.*` reads change.

- [ ] **Step 1: Update the two util test files**

`export.utils.test.ts` and `csv.utils.test.ts`: rewrite mock `Item[]` fixtures per the rename table, keep expected French header/output text unchanged.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd client && npx vitest run src/utils/__tests__/export.utils.test.ts src/utils/__tests__/csv.utils.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `client/src/utils/export.utils.ts` and `client/src/utils/csv.utils.ts`**

Read both files (not yet inspected in this planning pass — this app's export utils mirror the Angular `export.utils.ts` pattern from Task 9). Change only the `item.*` property reads per the rename table; leave French header/column-label strings untouched, following the exact same worked pattern shown in Task 9 Step 6.

- [ ] **Step 4: Run the util tests to verify they pass**

Run: `cd client && npx vitest run src/utils/__tests__/export.utils.test.ts src/utils/__tests__/csv.utils.test.ts`
Expected: PASS

- [ ] **Step 5: Update the remaining page/component files**

For each of `articles.tsx`, `home.tsx`, `history.tsx`, `ItemModale.tsx`, `AddModale.tsx`, `FiltersModal.tsx`, `Statistics.tsx`: open the file, apply the rename table to every JSX binding, form field, filter-state key, and sort key. This is the same mechanical pattern as Task 11 Step 4 — follow Task 11's worked `item-card` example as the reference pattern.

For `history.tsx` specifically: apply the same fix as Task 11 Step 5 — any `field === 'quantite'` check becomes `field === 'quantity'` only (drop the old OR-branch), and any `details.denomination` read becomes `details.name`.

Confirm `client/src/pages/contacts/contacts.tsx` is unrelated to `item.fournisseur` (it's the separate suppliers/contacts directory feature) before touching it — per the Global Constraints, leave it alone if so.

- [ ] **Step 6: Full React type-check**

Run: `cd client && npx tsc --noEmit`
Expected: zero errors. As in Task 11, treat any remaining error as the authoritative signal of a missed occurrence.

- [ ] **Step 7: Run the full React test suite**

Run: `cd client && npm test`
Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add client/src/pages/ client/src/components/ client/src/utils/
git commit -m "feat: rename item fields across React pages, components, and export utils"
```

---

## Final Verification (after Task 13)

1. `cd server && npm test` — full backend suite green.
2. `cd client-ng && npm test` and `cd client && npm test` — both frontend suites green.
3. `cd server && npx tsc --noEmit`, `cd client-ng && npx tsc --noEmit -p tsconfig.app.json`, `cd client && npx tsc --noEmit` — all three clean.
4. **Before touching production data**, per the spec: rehearse the Task 1 migration script (dry-run then real) against a local/staging Mongo copy of production data, start the updated backend + both frontends against it, and manually exercise the full checklist in the spec's Verification section (item CRUD, prepa-batch cassette rule, dashboard stats, history log rendering, CSV/PDF/XLSX export) on both frontends.
5. **Production cutover**: run the migration script against Atlas, drop the two orphaned old-name indexes (`db.item.getIndexes()` then `db.item.dropIndex(...)`), let `deploy.yml` deploy server + client-ng + client together.
6. Post-deploy spot check on both live frontends.
