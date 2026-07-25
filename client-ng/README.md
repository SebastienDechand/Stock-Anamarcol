<div align="center">

# Stock Anamarcol - Frontend Angular

**Réécriture Angular du frontend Stock Anamarcol**

✅ Frontend de production - a remplacé l'ancienne application React, supprimée du dépôt.

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NgRx](https://img.shields.io/badge/NgRx-21-BA2BD2?style=flat-square&logo=redux&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=flat-square&logo=vitest&logoColor=white)

</div>

---

## 📦 Stack technique

| Technologie                | Rôle                                       |
| -------------------------- | ------------------------------------------ |
| **Angular 21**             | Framework (composants standalone, signals) |
| **TypeScript**             | Typage statique                            |
| **NgRx (store + effects)** | State management par feature               |
| **RxJS**                   | Flux asynchrones, interop signals          |
| **@ngx-translate**         | Internationalisation (FR / EN)             |
| **lucide-angular**         | Icônes SVG                                 |
| **ng2-charts / Chart.js**  | Graphiques (dashboard)                     |
| **jsPDF / xlsx**           | Export PDF / XLSX                          |
| **ngx-toastr**             | Notifications toast                        |
| **Sass**                   | Styling (tokens & mixins partagés)         |
| **Vitest**                 | Tests unitaires                            |

---

## 🗂️ Architecture

```
client-ng/
├── public/i18n/                 fr.json, en.json (@ngx-translate)
├── proxy.conf.json               Proxy dev → API backend (localhost:4000)
│
├── src/
│   ├── environments/            environment.ts (prod), environment.development.ts (dev)
│   │
│   ├── scss/
│   │   ├── _tokens.scss         Design tokens (couleurs, espacements, dark mode via [data-theme='dark'])
│   │   └── _mixins.scss         Mixins partagés (breakpoints, boutons, cards, forms...)
│   │
│   ├── styles.scss              Styles globaux + overrides dark mode
│   │
│   └── app/
│       ├── core/
│       │   ├── auth/            authGuard, guestGuard, roleGuard(role), auth.service, auth.interceptor
│       │   ├── http/            api.service (wrapper HttpClient, base URL = environment.apiUrl)
│       │   ├── layout/          Layout (Sidebar + Topbar + router-outlet)
│       │   ├── routing/         Stratégie de réutilisation des routes
│       │   ├── services/        theme.service (dark mode), language.service (FR/EN)
│       │   └── toast/           toast.service (wrapper ngx-toastr)
│       │
│       ├── features/            Un dossier par domaine métier
│       │   ├── admin-roles/       Gestion des rôles (superadmin)
│       │   ├── articles/          Grille articles, filtres, prépa batch, export
│       │   ├── contacts/          Annuaire par catégorie
│       │   ├── envois/            Gestion des envois (hotline+)
│       │   ├── fiches-clients/    Fiches détaillées par client (monteur+)
│       │   ├── flotte/            Gestion des véhicules (admin)
│       │   ├── history/           Journal historique & audit (admin)
│       │   ├── home/              Dashboard / accueil
│       │   ├── legal/             Mentions légales
│       │   ├── login/             Connexion (derrière guestGuard)
│       │   ├── membres/           Équipe organisée par pôles
│       │   ├── not-found/         Page 404 (route wildcard `**`)
│       │   ├── profil/            Profil utilisateur
│       │   ├── rapports-intervention/  Rapports d'intervention terrain (monteur+)
│       │   └── surveillance/      Caméras de l'entreprise (admin)
│       │
│       │   Chaque feature routée expose `<feature>.routes.ts` (lazy-loaded) et,
│       │   si elle a un état partagé, un dossier `store/` NgRx :
│       │   actions · reducer · effects · selectors · state · facade
│       │
│       ├── shared/
│       │   ├── components/      access-denied, badge, confirm-dialog, date-input,
│       │   │                    kpi-card, modal, page-hero, spinner...
│       │   ├── constants/        Fournisseurs, états, rôles (miroir de server/constants)
│       │   ├── directives/
│       │   ├── models/           Interfaces TypeScript
│       │   ├── pipes/
│       │   └── utils/
│       │
│       ├── app.routes.ts        Arbre de routes (voir ci-dessous)
│       ├── app.config.ts        Providers (Router, HttpClient, Store, Translate...)
│       └── app.ts                Composant racine
│
├── angular.json
├── tsconfig.json
└── package.json
```

---

## 🧭 Routes

| Chemin                   | Feature                 |           Guard           | Description                                   |
| ------------------------ | ----------------------- | :-----------------------: | --------------------------------------------- |
| `/` _(guest)_            | Login                   |       `guestGuard`        | Connexion - redirige si déjà authentifié      |
| `/home`                  | Dashboard               |        `authGuard`        | Statistiques et vue d'ensemble                |
| `/articles`              | Articles                |        `authGuard`        | Grille articles, filtres, prépa batch, export |
| `/membres`               | Membres                 |        `authGuard`        | Équipe organisée par pôles                    |
| `/contacts`              | Contacts                |        `authGuard`        | Annuaire contacts par catégorie               |
| `/profil`                | Profil                  |        `authGuard`        | Profil utilisateur, avatar, édition           |
| `/envois`                | Envois                  |  `roleGuard('hotline')`   | Gestion des envois et expéditions             |
| `/fiches-clients`        | Fiches clients          |  `roleGuard('monteur')`   | Fiches détaillées par client                  |
| `/rapports-intervention` | Rapports d'intervention |  `roleGuard('monteur')`   | Rapports d'intervention terrain               |
| `/flotte`                | Flotte véhicules        |   `roleGuard('admin')`    | Gestion des véhicules de l'entreprise         |
| `/surveillance`          | Surveillance            |   `roleGuard('admin')`    | Caméras de l'entreprise en continu            |
| `/history`               | Historique              |   `roleGuard('admin')`    | Journal des modifications et audit            |
| `/admin/roles`           | Admin - Rôles           | `roleGuard('superadmin')` | Gestion des rôles utilisateurs                |
| `/legal`                 | Mentions légales        |        `authGuard`        | Page statique                                 |
| `**`                     | Not Found               |             -             | Page 404                                      |

> Toutes les routes (sauf `/` et `**`) sont chargées en lazy-loading (`loadChildren`) derrière le `Layout` (Sidebar + Topbar), lui-même protégé par `authGuard`. `roleGuard(role)` vérifie que l'utilisateur possède le rôle demandé **ou** `admin`/`superadmin` (héritage des permissions, cohérent avec les middlewares du serveur).

---

## 🗃️ State Management - NgRx

Chaque feature avec un état partagé a son propre store isolé sous `features/<feature>/store/` :

| Fichier                  | Rôle                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| `<feature>.actions.ts`   | Actions NgRx (create/dispatch)                                    |
| `<feature>.reducer.ts`   | Reducer pur (état → nouvel état)                                  |
| `<feature>.effects.ts`   | Effets (appels API via `ApiService`, side-effects)                |
| `<feature>.selectors.ts` | Sélecteurs mémoïsés                                               |
| `<feature>.state.ts`     | Interface de l'état + état initial                                |
| `<feature>.facade.ts`    | Façade injectable exposant des Observables/Signals aux composants |

Les composants n'injectent jamais le `Store` directement : ils passent par la **Facade** de leur feature (`inject(ItemsFacade)`, par ex.), qui encapsule le dispatch d'actions et l'exposition des sélecteurs.

---

## 🔐 Authentification & Guards (`core/auth/`)

| Fichier               | Rôle                                                                      |
| --------------------- | ------------------------------------------------------------------------- |
| `auth.service.ts`     | Login/logout, appelle `GET /jwtid`, expose l'utilisateur courant (signal) |
| `auth.interceptor.ts` | Intercepteur HTTP (cookies credentials, gestion des 401)                  |
| `auth.guard.ts`       | Exige une session valide → sinon redirige vers `/`                        |
| `guest.guard.ts`      | Inverse de `authGuard` - redirige vers `/home` si déjà connecté           |
| `role.guard.ts`       | `roleGuard(role)` - exige `role` (ou `admin`/`superadmin`) sur la route   |

> Les rôles (`superadmin`, `admin`, `hotline`, `monteur`, `user`) sont cumulables (tableau `roles[]`), identique au modèle backend - voir [server/README.md](../server/README.md).

---

## 🎨 Styling

- **Design tokens** (`src/scss/_tokens.scss`) : couleurs (`--brand-*`, `--surface-*`, `--primary-*`), espacements, rayons, ombres - dupliqués en variantes light (`:root`) et dark (`html[data-theme='dark']`).
- **Mixins** (`src/scss/_mixins.scss`) : breakpoints (`sm`/`md`/`lg`/`xl`/`xxl`), boutons (`btn-primary`, `btn-icon`...), cards, formulaires.
- **Dark mode** : géré par `theme.service.ts`, qui pose l'attribut `data-theme` sur `<html>`. Attention à la spécificité CSS entre les overrides globaux `html[data-theme='dark'] .foo` et les styles scopés par composant (Angular ajoute un attribut `_ngcontent-*` sur les sélecteurs de composant) - en cas de doute, dupliquer explicitement les états `--active` dans le bloc dark mode plutôt que compter sur la cascade.
- Chaque composant a son propre fichier `.scss` (`ViewEncapsulation` par défaut).

---

## 🌍 Internationalisation

`@ngx-translate/core` + `@ngx-translate/http-loader`, fichiers de traduction dans `public/i18n/fr.json` et `public/i18n/en.json`. Géré par `language.service.ts`.

---

## 🌐 Variables d'environnement

| Fichier                      | `apiUrl`                                | Usage               |
| ---------------------------- | --------------------------------------- | ------------------- |
| `environment.development.ts` | `/` (proxy `proxy.conf.json` → `:4000`) | `ng serve`          |
| `environment.ts`             | `https://stock-api.anamarcol.com/`      | Build de production |

---

## 📜 Scripts

```bash
npm start            # Serveur de dev (ng serve, port 4200, proxy API)
npm run build        # Build production → dist/
npm run watch        # Build en mode watch (développement)
npm test             # Tests Vitest
npm run test:watch   # Tests en mode watch
npm run test:ui      # Interface Vitest UI
npm run format       # Prettier sur src/**
```

---

## 🧪 Tests

|                 | Détail                                                              |
| --------------- | ------------------------------------------------------------------- |
| **Framework**   | Vitest (`ng test`, configuré via `@angular/build`)                  |
| **Emplacement** | Colocalisé : `x.ts` + `x.spec.ts` côte à côte (pas de dossier `__tests__/`) |
| **Couverture**  | Composants de features, guards, services core, pipes/utils partagés |

---

## 🔄 CI

Testée dans `.github/workflows/ci.yml` (job `test-client-ng`, en parallèle des tests backend). Déployée en production via `deploy.yml` (build + FTP vers o2switch).
