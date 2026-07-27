<div align="center">

# 📦 Stock Anamarcol

**Internal stock management application for Anamarcol**

Real-time tracking of items, quantities, suppliers, shipments, and contacts.

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![NgRx](https://img.shields.io/badge/NgRx-Store-764ABC?style=for-the-badge&logo=redux&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=node.js&logoColor=white)

[![CI](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/ci.yml/badge.svg)](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/ci.yml)
[![Deploy](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/deploy.yml/badge.svg)](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/deploy.yml)

</div>

---

## ✨ Features

| Feature                    | Description                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| **Item management**        | Full CRUD, quantity tracking, low-stock alerts                                               |
| **Suppliers & statuses**   | Advanced filters by supplier, status (NEW / RMA) and preparation                              |
| **Dashboard**               | Global, per-supplier and per-status statistics with charts                                    |
| **Batch preparation**      | Grouped decrement/increment (CashGuard, TPV register)                                        |
| **History & audit**        | Item change tracking, audit log, superadmin purge                                             |
| **Multi-format export**    | Export filtered items to CSV, XLSX and PDF                                                    |
| **Shipments**               | Shipment management with tracking and archiving                                               |
| **Client files**           | Detailed per-client files, history and associated documents                                   |
| **Intervention reports**   | Creation and tracking of field intervention reports                                           |
| **Contacts**                | Internal directory with detailed cards and photo upload                                       |
| **Members**                 | Team management by department (Management, Hotline, Warehouse, Installer, Site Management)    |
| **Vehicle fleet**          | Company vehicle management and tracking (admin only)                                          |
| **Surveillance**           | Continuous display of company cameras (admin only)                                            |
| **Image upload**           | Item photos, profile and contact avatars via ImgBB                                            |
| **Authentication**         | JWT with 5 stackable roles (superadmin / admin / hotline / monteur / user)                    |

---

## 🏗️ Tech stack

<table>
<tr>
<td width="50%" valign="top">

### Frontend

| Technology            | Role                                |
| ----------------------- | ------------------------------------ |
| **Angular 21**          | UI (standalone components, signals) |
| **TypeScript**          | Static typing                       |
| **NgRx**                | State management (store + effects)  |
| **SCSS (BEM)**          | Component-scoped styling            |
| **@ngx-translate**      | i18n (FR by default, EN available)  |
| **lucide-angular**      | Icons                                |

</td>
<td width="50%" valign="top">

### Backend

| Technology        | Role                  |
| ------------------ | ---------------------- |
| **Node.js 24**     | Runtime                |
| **Express 5**      | HTTP framework          |
| **TypeScript**     | Static typing           |
| **MongoDB Atlas**  | Database                |
| **Mongoose 9**     | ODM                     |
| **JWT**            | Authentication          |
| **Bcrypt**         | Password hashing        |
| **Multer**         | File uploads             |
| **Helmet**         | HTTP security            |
| **ImgBB**          | Image hosting            |

</td>
</tr>
</table>

---

## 📁 Architecture

```
Stock-Anamarcol
├── client-ng/                   Angular 21 application (SPA) — deployed to production
│   └── src/app/
│       ├── core/                Layout, guards, config
│       ├── features/            One folder per domain (items, contacts, shipments,
│       │                        client-files, fleet, history, home, members,
│       │                        profile, intervention-reports, surveillance,
│       │                        admin-roles, login, legal, not-found)
│       │   └── */store/         NgRx state management (store + effects) per feature
│       └── shared/              Shared components, constants, models
│
├── server/                     Express REST API
│   ├── config/                 Configuration (DB, Swagger)
│   ├── controllers/            Business logic
│   ├── middleware/             Auth, validation, roles
│   ├── models/                 Mongoose schemas
│   ├── routes/                 Route definitions
│   └── utils/                  Upload, validation, history, audit
│   (tests are colocated next to their source file, e.g. `x.ts` + `x.test.ts`)
│
└── .github/workflows/          CI/CD (backend + client-ng tests, E2E, deploy)
```

---

## 🚀 Quick start

### Requirements

> **Node.js** >= 18.x • **npm** >= 9.x • **MongoDB Atlas** • **ImgBB** API key
> (or just **Docker**, see below)

### 1️⃣ Clone the repo

```bash
git clone https://github.com/SebastienDechand/Stock-Anamarcol.git
cd Stock-Anamarcol
```

### 2️⃣ Install dependencies

```bash
cd server && npm install
cd ../client-ng && npm install
```

### 3️⃣ Environment variables

<details>
<summary><strong>Backend</strong> — <code>server/config/.env</code></summary>

```env
PORT=4000
DB_USER_PASS=<user>:<password>
MONGO_HOST=<cluster>.mongodb.net
CLIENT_URL=http://localhost:4200
TOKEN_SECRET=<your_jwt_secret>
SUPERADMIN_EMAIL=<superadmin_email>
IMGBB_API_KEY=<your_imgbb_key>
RESEND_API_KEY=<your_resend_key>
CAMERA_HOST=<camera_ip>
CAMERA_USERNAME=<camera_user>
CAMERA_PASSWORD=<camera_password>
```

</details>

### 4️⃣ Run in development

**Via Docker (recommended)** — a single command starts both backend and frontend with hot reload:

```bash
npm run dev
```

**Native** (without Docker):

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client-ng && npm start
```

> The app is available at **http://localhost:4200**

---

## 📜 Scripts

### Root (Docker)

| Command                | Description                                        |
| ------------------------ | ----------------------------------------------------- |
| `npm run dev`           | Backend + frontend in containers, hot reload           |
| `npm test`              | Backend + frontend tests, via Docker                   |
| `npm run test:server`   | Backend tests only, via Docker                         |
| `npm run test:client`   | Frontend tests only, via Docker                        |
| `npm run test:e2e`      | Playwright E2E tests (native, outside Docker)           |
| `npm run ci`            | `test` + `test:e2e` — full equivalent of the CI pipeline |

<table>
<tr>
<td width="50%" valign="top">

### Client (Angular)

| Command              | Description          |
| ---------------------- | ---------------------- |
| `npm start`           | Angular dev server     |
| `npm run build`       | Production build       |
| `npm test`            | Vitest tests            |
| `npm run test:watch`  | Tests in watch mode     |

</td>
<td width="50%" valign="top">

### Server

| Command            | Description             |
| -------------------- | ------------------------- |
| `npm run dev`       | nodemon + ts-node          |
| `npm run build`     | Compile TS → `dist/`       |
| `npm start`         | Run the build              |
| `npm test`          | Vitest tests                |
| `npm run test:ci`   | Tests + coverage            |

</td>
</tr>
</table>

---

## 🔄 CI/CD

The project uses **GitHub Actions** with two workflows:

### `ci.yml` — Continuous integration

> Triggered on push to `main`/`develop` and PRs targeting `main`

```
Backend tests (Vitest) ⇉ Frontend tests (Vitest) ⇉ E2E tests (Playwright)
```

> The 3 jobs run in parallel (no build in this workflow).

### `deploy.yml` — Deployment

> Triggered on push to `main` or manual dispatch

```
Gate (CI) → Build + FTP client-ng (Angular) → Build TS + FTP server → warm-up request
```

> Hosting: **o2switch** (FTP). The backend deploy touches `tmp/restart.txt` to force
> Passenger to reload the Node app after each deployment, then a warm-up request hits
> the live URL so the cold start (Passenger spawn + MongoDB connection) is absorbed by
> the pipeline instead of the first real visitor.

---

## 🔐 Roles & Permissions

> Roles are stackable (a user can be `hotline` **and** `monteur`, for example). `admin` and `superadmin` always inherit `hotline`/`monteur` permissions.

| Action                                        | User | Hotline | Monteur | Admin | Superadmin |
| ----------------------------------------------- | :--: | :-----: | :-----: | :---: | :--------: |
| View items                                      |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| Update quantities                                |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| Run batch preparations                           |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| View shipments                                   |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| View client files / reports                      |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| Create a shipment / mark it as sent               |  ❌  |   ✅    |   ❌    |  ✅   |     ✅     |
| Create / update client files and reports          |  ❌  |   ❌    |   ✅    |  ✅   |     ✅     |
| Add / update an item                              |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Delete an item / shipment / file / report         |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Export CSV / XLSX / PDF                          |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Manage contacts                                   |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| View roles / edit member profiles                 |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Access Vehicle fleet / Surveillance                |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| View history and audit log                        |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Add / remove a member                             |  ❌  |   ❌    |   ❌    |  ❌   |     ✅     |
| Change user roles                                 |  ❌  |   ❌    |   ❌    |  ❌   |     ✅     |
| Purge history and audit log                       |  ❌  |   ❌    |   ❌    |  ❌   |     ✅     |

---

## 📚 Detailed documentation

| Document                                          | Description                                            |
| -------------------------------------------------- | --------------------------------------------------------- |
| [**Angular client (Frontend)**](client-ng/README.md) | Angular architecture, NgRx, routes, guards, styling      |
| [**Server (Backend)**](server/README.md)          | Architecture, models, middleware, security (API reference: Swagger) |

---

## 👨‍💻 Author

**Sébastien Dechand** — [@SebastienDechand](https://github.com/SebastienDechand)

---

<div align="center">

*Internal project — All rights reserved — **Anamarcol***

</div>
