# Rename `item` model fields from French to English (pilot model)

## Context

The frontend was already rewritten in Angular with English-named folders/routes/components, but the actual **data model field names stayed French** end-to-end: the MongoDB `item` schema uses `denomination`, `quantite`, `fournisseur`, `etat`, `prepaCG`, `prepaTPV`, and both frontends (Angular `client-ng`, legacy React `client`) consume these exact French field names with **no DTO/translation layer** — the French names are the wire contract.

The goal is to finish the English migration by renaming these fields too, model by model, starting with `item` as the template for the other ~9 models (user, contact, vehicle, shipment, clientFile, interventionReport, history, audit, camera) which will each get their own pass later. This spec covers **only `item`**.

Decided during design:
- Full stack rename: DB documents (via migration script) + backend + both frontends, not just internal code.
- One model at a time, `item` first.
- Migration approach: one-off script + coordinated deploy (brief inconsistency window acceptable — low-traffic internal tool), not a zero-downtime dual-write scheme.
- Both frontends updated (Angular = production, React = backup at `/ng-preview/` must keep working).

## Confirmed field mapping

| Old (French) | New (English) |
|---|---|
| `denomination` | `name` |
| `quantite` | `quantity` |
| `fournisseur` | `supplier` |
| `etat` | `status` |
| `prepaCG` | `cgKit` |
| `prepaTPV` | `tpvKit` |
| `etat` value `"Neuf"` | `"NEW"` |
| `etat` value `"SAV"` | `"RMA"` |

Untouched: `posterId`, `modifierName`, `image`, `createdAt`, `updatedAt`, `_id`.

**Extended scope included:** the stats vocabulary built on top of these fields — response keys `fournisseurs`/`etats`, route segments `/statistics/fournisseurs/*` and `/statistics/etats/*`, and constants `FOURNISSEURS`/`ETATS` — are renamed too (`suppliers`/`statuses`, `/statistics/suppliers/*`, `/statistics/statuses/*`, `SUPPLIERS`/`STATUSES`), to avoid a half-migrated API surface.

Explicitly **out of scope**: i18n translation keys (`ITEMS.DENOMINATION` etc.), French display labels in CSV/PDF/XLSX exports (`'Dénomination'`, `'Fournisseur'`, ...), the `contacts`/suppliers-directory entity (different model, naming collision with `item.fournisseur` only), and the other 9 models.

## Migration script (new convention)

- **Location:** `server/scripts/migrations/2026-07-rename-item-fields.ts` — no prior migration-script convention exists in the repo; this establishes the pattern reused by the next 9 models.
- **Connects via the raw Mongo driver** (`mongoose.connection.collection("item")`), not the Mongoose model, so it doesn't depend on which version of `item.model.ts` is checked out when it runs.
- **Idempotent, guarded by `$exists`/value filters** so it's safe to re-run:
  1. Pre-flight: log counts of not-yet-migrated vs already-migrated documents.
  2. `updateMany({ denomination: { $exists: true } }, { $rename: { denomination: "name", quantite: "quantity", fournisseur: "supplier", etat: "status", prepaCG: "cgKit", prepaTPV: "tpvKit" } })`.
  3. `updateMany({ status: "Neuf" }, { $set: { status: "NEW" } })` then `updateMany({ status: "SAV" }, { $set: { status: "RMA" } })`.
  4. Print before/after counts + a few sample documents.
- **Dry-run flag** that only does the pre-flight report, no writes.
- **Run manually, once**, by a developer with DB access — not wired into `deploy.yml`. Take an Atlas backup (or `mongodump` of the `item` collection) first. Rehearse against a local/staging Mongo copy before running on production.
- **Sequencing:** run the script against production right before merging/deploying the code branch, so the "brief inconsistency window" is just the gap between the script finishing and the new code going live via the existing `deploy.yml`.
- After running in production, manually drop the two orphaned old-name indexes (`db.item.getIndexes()` to find their auto-generated names, then `db.item.dropIndex(...)`).

## Backend changes (`server/`)

1. `models/item.model.ts` — `IItem` interface + schema, all 6 fields renamed; indexes become `{ supplier:1, status:1, name:1 }` and `{ quantity:1 }`.
2. `constants/index.ts` — `ETATS → STATUSES = ["NEW","RMA"]`, `Etat → Status` type; `FOURNISSEURS → SUPPLIERS` (identifier only, values are proper nouns, unchanged).
3. `types/errors.ts` — `CreateItemError { name, supplier, status, quantity }`.
4. `types/stats.ts` — `LowStockItemResult { name, supplier, status, quantity }`; `DashboardResult { global, suppliers, statuses, lowStockItems }`; `DashboardGlobalStats.prepaCG/prepaTPV → cgKit/tpvKit` (these are computed KPI values mirroring the same domain concept, renamed for consistency).
5. `errors.utils.ts` — `createItemErrors` rebuilt with new keys; fix the enum mention in the validation message ("Neuf ou SAV" → "NEW ou RMA" — confirm exact phrasing at implementation time since it's the one place a code value appears in French user-facing text).
6. `utils/history.utils.ts` — `TRACKED_FIELDS = ["name","supplier","status","cgKit","tpvKit","image"]`; `logItemDelete`/`logItemChanges` field renames (`"denomination"→"name"`, `"quantite"→"quantity"`).
7. `controllers/item.controller.ts` — `readItem` (query/filter keys, `sortBy` default, cassette-check now reads `name`), `createItem`/`updateItem` (body destructuring/assignment), `deleteItem` (history log call), `prepaBatch` (`"prepaCG"/"prepaTPV"` literals → `"cgKit"/"tpvKit"`, `prepaLabel` mapping).
8. `controllers/uploadItem.controller.ts` — image filename builder uses `name`/`supplier`/`status`.
9. `controllers/audit.controller.ts` — `.select("name")`, `denomMap`/`auditItemNameMap`, outgoing `details.name` (must stay in sync with frontend history-page reads below).
10. `controllers/stats.controller.ts` — every aggregation stage and response key (`$sum`, `$addToSet`, `$group`, `.select`, `.distinct`, response keys `suppliers`/`statuses`), function renames (`getStatisticsForSupplier`, `getSuppliersList`, `getStatisticsForStatus`, `getStatusesList`).
11. `routes/statistics.routes.ts` — path segments `/suppliers*`, `/statuses*`, param names `:supplier`/`:status`.
12. `config/swagger.ts` — schema properties, query params, prepa-batch enum, updated stats paths.
13. `README.md` — update documented field names/examples.

## client-ng (Angular) changes

`shared/models/item.model.ts` (`Item`/`NewItem`/`FetchItemsParams`) → `shared/models/statistics.model.ts` → `shared/utils/prepa-filter.utils.ts` → `shared/utils/export.utils.ts` (object-key reads only; French column headers stay) → `features/items/store/{items.actions,items.effects,items.facade,items.reducer,items.selectors}.ts` (incl. `updateQuantite`→`updateQuantity` action/method renames — grep for any other string-match on the old action-type name first) → `features/items/items-page.ts/.html` → `components/item-card/`, `components/filters-modal/` (+spec), `components/edit-item-modal/` (+spec, reactive form control names), `components/add-item-modal/` (+spec), `components/export-modal/` (verify if it touches fields directly) → `features/home/store/statistics.selectors.ts`, `statistics.facade.ts`, `home-page.html`, `components/low-stock-table/`, `components/kpi-grid/` → `features/history/history-page.ts` (`field === 'quantity'`, `details['name']`) → all touched `.spec.ts` fixtures.

**Not touched:** `features/surveillance/**`, `features/fleet/**`, `contacts-page.ts`/`contacts.facade.ts` (different model, `fournisseurs` there means the supplier/contact directory, not `item.fournisseur`).

## client (React legacy backup) changes

`src/types/item.ts`, `src/types/statistics.ts` → `src/actions/{items,item,statistics}.actions.ts` → `src/reducers/{items,item,statistics}.reducer.ts` (+ its test) → `src/pages/articles/articles.tsx`, `src/pages/home/home.tsx`, `src/pages/history/history.tsx` (same field-name sync as Angular's history page) → `src/components/Modales/{ItemModale,AddModale,FiltersModal}.tsx` → `src/components/Stats/Statistics.tsx` → `src/utils/export.utils.ts` (+test), `src/utils/csv.utils.ts` (+tests). Confirm `src/pages/contacts/contacts.tsx` is unrelated (different `fournisseurs` usage) before touching it.

## Test files (mechanical field-name find/replace in mocks/assertions)

Backend: `item.controller.test.ts`, `stats.controller.test.ts`, `history.utils.test.ts`, `history.controller.test.ts`, `errors.utils.test.ts`, `constants.test.ts`. Update expectations to the new shape first (TDD-style), watch them fail against old code, then apply the matching source change. Include `"Neuf"/"SAV"` → `"NEW"/"RMA"` literal updates and stats route-path assertions (`/suppliers`, `/statuses`).

Frontend: all `.spec.ts` files listed alongside their source files above, on both `client-ng` and `client`.

## Verification

1. `cd server && npm test` — all 6 updated backend test files pass.
2. `cd client-ng && npm test` and `cd client && npm test` — items/stats/export specs pass.
3. Type-check both frontends (`tsc --noEmit` / `ng build --configuration=development`) — a rename with no DTO layer means any missed spot is a compile error; this is the strongest safety net here.
4. **Before touching production data:** run the migration script (dry-run, then real) against a local/staging Mongo copy of production data, start the updated backend + both frontends against it, and manually exercise: item list/search/filter/sort, create/edit/delete item (status NEW/RMA, cgKit/tpvKit toggles), prepa-batch (verify the cassette 4x rule still triggers off `name` containing "cassette"), dashboard stats (global KPIs, supplier/status breakdowns, low-stock tab filter, CG/TPV kit-completion KPIs), history log rendering (item name + quantity-change entries), CSV/PDF/XLSX export (French headers, correct values). Repeat the same smoke test against the React app.
5. **Production cutover:** re-run the migration script against Atlas, drop the two orphaned old-name indexes, let the existing `deploy.yml` deploy server + client-ng + client together as it already does.
6. **Post-deploy:** spot-check both frontends live to catch any document inserted between the migration script running and the new code going live.
