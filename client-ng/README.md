<div align="center">

# Stock Anamarcol - Angular Frontend

**Angular rewrite of the Stock Anamarcol frontend**

✅ Production frontend - replaced the previous React app, removed from the repo.

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NgRx](https://img.shields.io/badge/NgRx-21-BA2BD2?style=flat-square&logo=redux&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=flat-square&logo=vitest&logoColor=white)

</div>

---

## 📦 Tech stack

| Technology                  | Role                                  |
| ----------------------------- | ---------------------------------------- |
| **Angular 21**               | Framework (standalone components, signals) |
| **TypeScript**                | Static typing                            |
| **NgRx (store + effects)**   | State management per feature             |
| **RxJS**                      | Async streams, signal interop            |
| **@ngx-translate**            | i18n (FR / EN)                           |
| **lucide-angular**            | SVG icons                                |
| **ng2-charts / Chart.js**     | Charts (dashboard)                       |
| **jsPDF / xlsx**              | PDF / XLSX export                        |
| **ngx-toastr**                | Toast notifications                      |
| **Sass**                       | Styling (shared tokens & mixins)         |
| **Vitest**                     | Unit tests                               |

---

## 🗂️ Architecture

```
client-ng/
├── public/i18n/                 fr.json, en.json (@ngx-translate)
├── proxy.conf.json               Dev proxy → backend API (localhost:4000)
├── proxy.conf.docker.json        Same, for the Docker container (targets the "server" service)
├── proxy.conf.e2e.json           Same, for Playwright E2E (targets localhost:4001)
│
├── src/
│   ├── environments/            environment.ts (prod), environment.development.ts (dev)
│   │
│   ├── scss/
│   │   ├── _tokens.scss         Design tokens (colors, spacing, dark mode via [data-theme='dark'])
│   │   └── _mixins.scss         Shared mixins (breakpoints, buttons, cards, forms...)
│   │
│   ├── styles.scss              Global styles + dark mode overrides
│   │
│   └── app/
│       ├── core/
│       │   ├── auth/            authGuard, guestGuard, roleGuard(role), auth.service, auth.interceptor
│       │   ├── http/             api.service (HttpClient wrapper, base URL = environment.apiUrl)
│       │   ├── layout/           Layout (Sidebar + Topbar + router-outlet)
│       │   ├── routing/          Route reuse strategy
│       │   ├── services/         theme.service (dark mode), language.service (FR/EN)
│       │   └── toast/            toast.service (ngx-toastr wrapper)
│       │
│       ├── features/            One folder per business domain
│       │   ├── admin-roles/          Role management (superadmin)
│       │   ├── items/                Item grid, filters, batch prep, export
│       │   ├── contacts/             Directory by category
│       │   ├── shipments/            Shipment management (hotline+)
│       │   ├── client-files/         Detailed per-client files (monteur+)
│       │   ├── fleet/                Vehicle management (admin)
│       │   ├── history/              History & audit log (admin)
│       │   ├── home/                 Dashboard / home
│       │   ├── legal/                Legal notice
│       │   ├── login/                Login (behind guestGuard)
│       │   ├── members/              Team organized by department
│       │   ├── not-found/            404 page (wildcard route `**`)
│       │   ├── profile/              User profile
│       │   ├── intervention-reports/ Field intervention reports (monteur+)
│       │   └── surveillance/         Company cameras (admin)
│       │
│       │   Each routed feature exposes `<feature>.routes.ts` (lazy-loaded) and,
│       │   if it has shared state, a `store/` NgRx folder:
│       │   actions · reducer · effects · selectors · state · facade
│       │
│       ├── shared/
│       │   ├── components/      access-denied, badge, confirm-dialog, date-input,
│       │   │                    kpi-card, modal, page-hero, spinner...
│       │   ├── constants/        Suppliers, statuses, roles (mirrors server/constants)
│       │   ├── directives/
│       │   ├── models/           TypeScript interfaces
│       │   ├── pipes/
│       │   └── utils/
│       │
│       ├── app.routes.ts        Route tree (see below)
│       ├── app.config.ts        Providers (Router, HttpClient, Store, Translate...)
│       └── app.ts                Root component
│
├── angular.json
├── tsconfig.json
└── package.json
```

---

## 🧭 Routes

| Path                    | Feature                    |           Guard           | Description                                    |
| ------------------------ | ----------------------------- | :------------------------: | ------------------------------------------------ |
| `/` _(guest)_           | Login                         |       `guestGuard`        | Login - redirects if already authenticated       |
| `/home`                 | Dashboard                     |        `authGuard`        | Statistics and overview                          |
| `/items`                | Items                         |        `authGuard`        | Item grid, filters, batch prep, export           |
| `/members`              | Members                       |        `authGuard`        | Team organized by department                     |
| `/contacts`             | Contacts                      |        `authGuard`        | Contact directory by category                    |
| `/profile`              | Profile                       |        `authGuard`        | User profile, avatar, editing                    |
| `/shipments`            | Shipments                     |  `roleGuard('hotline')`   | Shipment and dispatch management                 |
| `/client-files`         | Client files                  |  `roleGuard('monteur')`   | Detailed per-client files                        |
| `/intervention-reports` | Intervention reports          |  `roleGuard('monteur')`   | Field intervention reports                       |
| `/fleet`                | Vehicle fleet                 |   `roleGuard('admin')`    | Company vehicle management                       |
| `/surveillance`         | Surveillance                  |   `roleGuard('admin')`    | Continuous company camera feed                   |
| `/history`              | History                       |   `roleGuard('admin')`    | Change and audit log                             |
| `/admin/roles`          | Admin - Roles                 | `roleGuard('superadmin')` | User role management                             |
| `/legal`                | Legal notice                  |        `authGuard`        | Static page                                      |
| `**`                    | Not Found                     |             -              | 404 page                                         |

> All routes (except `/` and `**`) are lazy-loaded (`loadChildren`) behind the `Layout` (Sidebar + Topbar), itself protected by `authGuard`. `roleGuard(role)` checks that the user has the requested role **or** `admin`/`superadmin` (permission inheritance, consistent with the server middleware).

---

## 🗃️ State Management - NgRx

Each feature with shared state has its own isolated store under `features/<feature>/store/`:

| File                      | Role                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `<feature>.actions.ts`    | NgRx actions (create/dispatch)                                        |
| `<feature>.reducer.ts`    | Pure reducer (state → new state)                                      |
| `<feature>.effects.ts`    | Effects (API calls via `ApiService`, side-effects)                     |
| `<feature>.selectors.ts`  | Memoized selectors                                                     |
| `<feature>.state.ts`      | State interface + initial state                                       |
| `<feature>.facade.ts`     | Injectable facade exposing Observables/Signals to components           |

Components never inject `Store` directly: they go through their feature's **Facade** (`inject(ItemsFacade)`, for example), which encapsulates action dispatch and selector exposure.

---

## 🔐 Authentication & Guards (`core/auth/`)

| File                   | Role                                                                        |
| ------------------------ | -------------------------------------------------------------------------------- |
| `auth.service.ts`      | Login/logout, calls `GET /jwtid`, exposes the current user (signal)             |
| `auth.interceptor.ts`  | HTTP interceptor (cookie credentials, 401 handling)                              |
| `auth.guard.ts`        | Requires a valid session → redirects to `/` otherwise                            |
| `guest.guard.ts`       | Inverse of `authGuard` - redirects to `/home` if already logged in               |
| `role.guard.ts`        | `roleGuard(role)` - requires `role` (or `admin`/`superadmin`) on the route        |

> Roles (`superadmin`, `admin`, `hotline`, `monteur`, `user`) are stackable (`roles[]` array), matching the backend model - see [server/README.md](../server/README.md).

---

## 🎨 Styling

- **Design tokens** (`src/scss/_tokens.scss`): colors (`--brand-*`, `--surface-*`, `--primary-*`), spacing, radii, shadows - duplicated in light (`:root`) and dark (`html[data-theme='dark']`) variants.
- **Mixins** (`src/scss/_mixins.scss`): breakpoints (`sm`/`md`/`lg`/`xl`/`xxl`), buttons (`btn-primary`, `btn-icon`...), cards, forms.
- **Dark mode**: managed by `theme.service.ts`, which sets the `data-theme` attribute on `<html>`. Watch out for CSS specificity between global overrides `html[data-theme='dark'] .foo` and component-scoped styles (Angular adds an `_ngcontent-*` attribute to component selectors) - when in doubt, explicitly duplicate `--active` states in the dark mode block instead of relying on the cascade.
- Each component has its own `.scss` file (default `ViewEncapsulation`).

---

## 🌍 Internationalization

`@ngx-translate/core` + `@ngx-translate/http-loader`, translation files in `public/i18n/fr.json` and `public/i18n/en.json`. Managed by `language.service.ts`.

---

## 🌐 Environment variables

| File                          | `apiUrl`                                 | Usage                |
| ------------------------------- | ------------------------------------------ | ----------------------- |
| `environment.development.ts`  | `/` (proxy `proxy.conf.json` → `:4000`)    | `ng serve`              |
| `environment.ts`               | `https://stock-api.anamarcol.com/`         | Production build         |

---

## 📜 Scripts

```bash
npm start            # Dev server (ng serve, port 4200, API proxy)
npm run start:docker # Same, for the Docker container (proxy.conf.docker.json)
npm run build        # Production build → dist/
npm run watch        # Watch-mode build (development)
npm test             # Vitest tests
npm run test:watch   # Tests in watch mode
npm run test:ui      # Vitest UI
npm run e2e          # Playwright E2E tests (starts its own back+front, ports 4001/4201)
npm run format       # Prettier on src/**
```

---

## 🧪 Tests

### Unit

|                  | Detail                                                                    |
| ------------------ | ---------------------------------------------------------------------------- |
| **Framework**     | Vitest (`ng test`, configured via `@angular/build`)                          |
| **Location**      | Colocated: `x.ts` + `x.spec.ts` side by side (no `__tests__/` folder)        |
| **Coverage**      | Feature components, guards, core services, shared pipes/utils                |

### End-to-end (Playwright)

|                  | Detail                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Framework**     | Playwright (`npm run e2e`, config in `playwright.config.ts`)                             |
| **Location**      | `e2e/*.spec.ts`                                                                          |
| **Backend**       | Started by Playwright itself (`../server/e2eServer.ts`), in-memory MongoDB               |
| **Ports**         | 4001 (API) / 4201 (frontend) - dedicated so this never collides with a `docker compose up` already running in the background (see repo root) |
| **Coverage**      | Full flows: login, items, contacts, shipments, client files, fleet                       |

---

## 🔄 CI

Tested in `.github/workflows/ci.yml` (job `test-client-ng`, in parallel with the backend and E2E jobs). Deployed to production via `deploy.yml` (build + FTP to o2switch).
