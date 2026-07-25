# CLAUDE.md — Stock Anamarcol

Directives de développement pour Claude Code sur ce projet.

---

## Vue d'ensemble

Application interne de gestion de stock pour Anamarcol.
Monorepo `client-ng/` (Angular SPA) + `server/` (Express REST API).

---

## Stack

| Couche          | Technologie                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Frontend        | Angular 21 (composants standalone, signals pour l'état local), TypeScript 5, NgRx (store + effects)   |
| Styling         | SCSS scopé par composant, convention BEM (`bloc__element--modificateur`), pas de framework utilitaire |
| Backend         | Node.js 20, Express 5, TypeScript 5                                                                   |
| Base de données | MongoDB Atlas, Mongoose 9                                                                             |
| Auth            | JWT (cookie httpOnly), bcrypt                                                                         |
| i18n            | `@ngx-translate/core`, FR par défaut, EN disponible                                                   |
| Icônes          | `lucide-angular`                                                                                      |
| Tests frontend  | Vitest (via `ng test`, builder `@angular/build:unit-test`)                                            |
| Tests backend   | Vitest                                                                                                |
| CI/CD           | GitHub Actions → FTP o2switch                                                                         |

---

## Structure des dossiers

Les tests sont **colocalisés** : `x.ts` + `x.spec.ts` (frontend) / `x.test.ts`
(backend) côte à côte, jamais dans un dossier `__tests__/` séparé. Dès qu'un
dossier contiendrait plusieurs fichiers `.ts` frères du même type (services,
utils, guards, slices NgRx d'un même store…), chaque fichier reçoit son propre
sous-dossier portant son nom (ex. `services/contacts/contacts.service.ts` +
`contacts.service.test.ts`) — voir les sections dédiées plus bas pour le détail
du nommage par contexte (services/utils/controllers vs slices NgRx).

```
client-ng/src/app/
  core/           Singletons applicatifs
    auth/           Un sous-dossier par guard/service/interceptor (auth.guard/, auth.service/…)
    http/           api.service.ts (wrapper HTTP générique) + spec, pas de sous-dossier (fichier unique)
    layout/         layout.ts, sidebar/, topbar/
    services/       Un sous-dossier par service (language/, theme/)
    toast/          toast.service.ts (fichier unique)
  features/       Un dossier par domaine métier
    <feature>/
      <feature>-page.ts/.html/.scss/.spec.ts   Page principale de la feature
      components/                                Composants/modales locaux à la feature
      store/                                     NgRx (si feature stateful) — voir plus bas
  shared/         Code réutilisable inter-features
    components/     spinner, page-hero, kpi-card, badge, confirm-dialog… (déjà un dossier par composant)
    constants/      Un sous-dossier par fichier de constantes ; `index.ts` (barrel) reste à plat
    directives/
    models/         Un sous-dossier par modèle (*.model.ts) ; `index.ts` (barrel) reste à plat
    pipes/          Un sous-dossier par pipe
    utils/          Un sous-dossier par fichier utilitaire
  store/          Slices NgRx globaux (non liés à une feature) : auth/, ui/

server/
  config/         DB, Swagger
  constants/      Valeurs partagées backend (index.ts + errorCodes.ts, cameras.ts)
  controllers/    Un sous-dossier par contrôleur (ex. contacts/contacts.controller.ts + .test.ts)
  middleware/     Un sous-dossier par middleware (auth/, rateLimit/, sanitize/)
  models/         Schémas Mongoose (pas de sous-dossier, pas de tests)
  routes/         Définition des routes Express
  scripts/        Scripts one-off (ex: migrations/) — jamais dans .github/workflows
  services/       Un sous-dossier par service (couche data-access Mongoose)
  utils/          Un sous-dossier par fichier utilitaire
```

---

## Conventions de nommage

| Type                     | Convention                                                                                    | Exemple                                        |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Composant Angular         | kebab-case `.ts`, pas de suffixe `.component`                                                  | `item-card.ts`, `items-page.ts`                  |
| Service Angular           | kebab-case `.service.ts`                                                                       | `api.service.ts`                                 |
| Modèle/Interface          | kebab-case `.model.ts`                                                                          | `item.model.ts`                                  |
| Store NgRx (par feature)  | kebab-case `.actions.ts` / `.effects.ts` / `.reducer.ts` / `.selectors.ts` / `.state.ts` / `.facade.ts` | `items.actions.ts`, `items.facade.ts`            |
| Action-type NgRx          | Title Case, verbe + résultat                                                                    | `'Load All Items'`, `'Load All Items Success'`   |
| Controller                | camelCase `.controller.ts`                                                                      | `item.controller.ts`                             |
| Model Mongoose            | camelCase `.model.ts`                                                                           | `item.model.ts`                                  |
| Routes                    | camelCase `.routes.ts`                                                                          | `item.routes.ts`                                 |
| Utils                     | camelCase `.utils.ts`                                                                           | `history.utils.ts`                               |
| Tests                     | même nom `.spec.ts` (frontend) / `.test.ts` (backend), colocalisé à côté du fichier             | `item.controller.test.ts`, `items.effects.spec.ts` |
| Types                     | camelCase `.ts`                                                                                 | `item.ts`, `user.ts`                             |
| Constantes                | SCREAMING_SNAKE_CASE                                                                            | `SUPPLIERS`, `USER_ROLES`                        |
| Fonctions/variables       | camelCase                                                                                       | `fetchItems`, `selectedItemId`                   |
| Clé i18n                  | `SCREEN.KEY` (majuscules, point comme séparateur d'écran)                                       | `'HOME.STOCK_BY_SUPPLIER'`                       |

---

## NgRx — Patterns

Chaque feature avec état a un dossier `store/` avec exactement 6 fichiers, chacun dans son propre sous-dossier nommé d'après son suffixe (les 6 fichiers partagent le même préfixe — le nom de la feature — donc c'est le suffixe qui distingue) :

- `state/*.state.ts` — forme du state de la feature
- `actions/*.actions.ts` — actions via `createActionGroup` (pas de classes d'action manuelles)
- `reducer/*.reducer.ts` — `createReducer` + `on(...)`
- `effects/*.effects.ts` — effets (appels API, side-effects)
- `selectors/*.selectors.ts` — sélecteurs via `createSelector`
- `facade/*.facade.ts` — **obligatoire** : façade `@Injectable({ providedIn: 'root' })` qui expose les observables (`xxx$ = store.select(selector)`) et des méthodes impératives qui dispatchent — les composants ne touchent **jamais** `Store` directement, seulement la façade

Exemple pour la feature `items` : `store/actions/items.actions.ts`, `store/reducer/items.reducer.ts` (+ `items.reducer.spec.ts` à côté), `store/effects/items.effects.ts`, `store/selectors/items.selectors.ts`, `store/facade/items.facade.ts`, `store/state/items.state.ts`.

`provideStore`/`provideEffects` sont câblés une seule fois dans `app.config.ts` (pas de `provideState` au niveau feature).

```typescript
// Convention des noms d'action-type
export const ItemsActions = createActionGroup({
  source: 'Items',
  events: {
    'Load All Items': emptyProps(),
    'Load All Items Success': props<{ items: Item[] }>(),
    'Load All Items Failure': props<{ error: string }>(),
  },
});
```

```typescript
// Façade — seul point d'entrée pour les composants
@Injectable({ providedIn: 'root' })
export class ItemsFacade {
  private store = inject(Store);
  items$ = this.store.select(selectPageItems);
  fetchItems(params: FetchItemsParams = {}) {
    this.store.dispatch(ItemsActions.fetchItems({ params }));
  }
}
```

---

## Composants Angular — Patterns

- Composants **standalone** uniquement, injection via `inject()` (jamais de constructeur pour l'injection)
- `input()`/`output()` signal-based (migration terminée) — ne pas revenir aux décorateurs `@Input()`/`@Output()`
- État local en `signal()`, dérivations en `computed()`
- Organiser le corps de la classe dans cet ordre :
  1. Services/façades injectés (`inject(...)`)
  2. Observables de façade exposés en champs (`xxx$ = this.facade.xxx$`)
  3. `input()`/`output()`
  4. État local (signals)
  5. Lifecycle (`ngOnInit`, etc.)
  6. Getters
  7. Handlers
- Sur les composants plus longs, séparateurs de section en commentaires `#region`/`#endregion` (même style que côté backend) :
  ```typescript
  // #region Context & Redux
  ...
  // #endregion

  // #region Streams
  ...
  // #endregion
  ```
- Rendu conditionnel avec la syntaxe de contrôle de flux native (`@if`, `@for`, `@switch`) — pas de `*ngIf`/`*ngFor`
- Pas de `any` TypeScript — typer correctement avec les interfaces de `shared/models/`

---

## Styling — SCSS / BEM

- **SCSS scopé par composant**, pas de framework utilitaire (pas de Tailwind côté Angular)
- Convention BEM stricte : `bloc__element--modificateur` (ex. `home__section-title`, `stock-chart__legend-item`)
- Mixins/variables partagés importés via `@use '.../scss/mixins' as m;`
- Icônes : **`lucide-angular`** exclusivement — `<lucide-icon name="..." [size]="16" />` ou icônes injectées comme champs de classe, jamais de SVG inline
- Toasts : `ToastService` (`core/toast/`) pour les feedbacks utilisateur, messages via clés i18n

---

## i18n

- Toujours passer par `TranslatePipe` (`| translate`) dans les templates, `TranslateService.instant(...)` côté TS
- Ne jamais coder en dur un texte visible par l'utilisateur — toujours une clé `SCREEN.KEY`
- Fichiers de traduction : `client-ng/public/i18n/fr.json` et `en.json`
- FR est la langue par défaut à l'ouverture (pas de détection de langue navigateur) ; le thème par défaut est clair — voir `language.service.ts`/`theme.service.ts`

---

## API Backend — Patterns

- Routes organisées par domaine : `/api/item/`, `/api/user/`, `/api/contacts/`, etc.
- Controllers contiennent la logique métier — les routes ne font que brancher
- Middleware d'auth sur toutes les routes protégées : `requireAuth`, `requireAdmin`, etc.
- Validation des inputs dans `utils/validate.utils.ts`
- Gestion des erreurs centralisée via `errors.utils.ts`
- Utiliser `.lean()` sur les requêtes Mongoose en lecture seule (perf)
- Toujours logger les changements d'items via `logItemChanges()` de `utils/history.utils.ts`
- Toujours logger les actions sensibles via `utils/audit.utils.ts`
- Scripts one-off (migrations de données, etc.) dans `server/scripts/`, jamais câblés dans `.github/workflows/` — exécution manuelle uniquement

```typescript
// Réponses HTTP
res.status(200).json({ data }); // Succès
res.status(201).json({ message, data }); // Création
res.status(400).json({ message }); // Mauvaise requête
res.status(401).json({ message }); // Non authentifié
res.status(403).json({ message }); // Non autorisé
res.status(404).json({ message }); // Non trouvé
res.status(500).json({ message }); // Erreur serveur
```

---

## Sécurité

- **Ne jamais** exposer le JWT secret ou les credentials en clair
- Toujours passer par le middleware `requireAuth` pour les routes privées
- Sanitiser les inputs MongoDB (mongoSanitize déjà en place)
- Ne pas construire de requêtes Mongoose avec des entrées utilisateur brutes
- Mots de passe : toujours hasher avec bcrypt avant persistance

---

## RBAC — Rôles

Les rôles sont stockés en **tableau** sur le User (`roles: string[]`).
Rôles disponibles : `SUPERADMIN`, `ADMIN`, `HOTLINE`, `MONTEUR`, `USER`

- Vérifier les rôles côté **backend** via les middlewares (source de vérité)
- Côté **frontend**, utiliser `AuthFacade` (`store/auth/facade/auth.facade.ts`) — observables `isAdmin$`, `isSuperadmin$`, `isHotline$`, `isMonteur$` — pour l'affichage conditionnel et les guards de routes (`core/auth/role.guard/role.guard.ts`) uniquement
- Ne jamais faire confiance au frontend pour des décisions de sécurité

---

## Tests

**Backend (Vitest)** :

- Mocker les models Mongoose avec `vi.mock()`
- Tester controllers, middleware et utils
- Un fichier de test par controller/service/util, colocalisé à côté (`x.ts` + `x.test.ts` dans le même sous-dossier), jamais dans un dossier `__tests__/`

**Frontend (Vitest, via `ng test`)** :

- Ne jamais lancer un `.spec.ts` avec `npx vitest run` directement s'il touche à Angular (TestBed, injectables NgRx) — ça échoue avec `ActionsSubject`/JIT compiler manquant. Toujours passer par `npx ng test --watch=false [--include="..."]`, qui compile l'app avant de lancer les tests
- Effects : mockés via `provideMockActions` + `provideMockStore` (`@ngrx/effects/testing`, `@ngrx/store/testing`)
- Façades/composants : mockés via `vi.fn()`/`vi.mock()` (API Vitest, pas Jest)
- Tester les fonctions utilitaires pures en priorité
- Tests colocalisés à côté du fichier concerné (`x.ts` + `x.spec.ts`), jamais dans un dossier `__tests__/`

**À ne pas faire** : ne pas écrire de tests qui testent l'implémentation interne, tester le comportement observable.

---

## Ce qu'il ne faut pas faire

- Ne pas dispatcher `Store` directement depuis un composant — toujours passer par la façade de la feature
- Ne pas utiliser les décorateurs `@Input()`/`@Output()` — la migration vers `input()`/`output()` signal-based est terminée, voir section Composants
- Ne pas utiliser `*ngIf`/`*ngFor` — syntaxe de contrôle de flux native (`@if`/`@for`) uniquement
- Ne pas ajouter de commentaires JSDoc ou docstrings sur du code existant non modifié
- Ne pas créer de nouveaux fichiers si une modification d'un fichier existant suffit
- Ne pas ajouter de gestion d'erreurs pour des cas impossibles
- Ne pas refactoriser du code autour d'un bug fix — corriger uniquement ce qui est demandé
- Ne pas utiliser `any` TypeScript
- Ne pas commiter sans que l'utilisateur le demande explicitement
