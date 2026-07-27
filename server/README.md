<div align="center">

# ⚙️ Stock Anamarcol - Backend

**REST API for Anamarcol stock management**

Express 5 • TypeScript • MongoDB Atlas • JWT

![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=flat-square&logo=vitest&logoColor=white)

</div>

---

## 📦 Tech stack

| Technology    | Version | Role                                |
| ------------- | ------- | ------------------------------------ |
| Node.js       | `24.x`  | Runtime                             |
| Express       | `5.2`   | HTTP framework                      |
| TypeScript    | `5.9`   | Static typing                       |
| MongoDB Atlas | `-`     | Database                            |
| Mongoose      | `9.2`   | ODM (Object Document Mapper)        |
| JWT           | `9.0`   | Token-based authentication          |
| Bcrypt        | `6.0`   | Password hashing                    |
| Multer        | `2.0`   | File uploads (memory storage)       |
| ImgBB API     | `-`     | Image hosting                       |
| Helmet        | `8.1`   | HTTP security headers               |
| Compression   | `1.8`   | Gzip compression                    |
| CORS          | `2.8`   | Cross-origin policy                 |
| Cookie Parser | `1.4`   | JWT cookie parsing                  |
| Validator     | `13.15` | Email validation                    |

---

## 🗂️ Architecture

Tests are colocated next to the file they cover, `x.ts` + `x.test.ts` side by
side (no `__tests__/` subfolder) - same convention as the Angular frontend.

```
server/
├── config/
│   ├── db.ts                             MongoDB Atlas connection
│   └── swagger.ts                        Swagger configuration (dev only)
│
├── constants/
│   ├── index.ts                          Shared constants (SUPPLIERS, STATUSES, Role...)
│   ├── index.test.ts
│   ├── errorCodes.ts
│   └── cameras.ts
│
├── controllers/                       One subfolder per controller, test alongside
│   ├── audit/audit.controller.ts         Global history & purge
│   ├── auth/auth.controller.ts           Register, login, logout
│   ├── camera/camera.controller.ts       Camera stream proxy
│   ├── clientFile/clientFile.controller.ts
│   ├── contacts/contacts.controller.ts
│   ├── history/history.controller.ts
│   ├── interventionReport/interventionReport.controller.ts
│   ├── item/item.controller.ts           Item CRUD + preparationBatch
│   ├── reminder/reminder.controller.ts   Vehicle reminder trigger endpoint
│   ├── shipments/shipments.controller.ts
│   ├── stats/stats.controller.ts         Statistics & dashboard
│   ├── upload/upload.controller.ts       Profile avatar upload
│   ├── uploadContact/uploadContact.controller.ts
│   ├── uploadItem/uploadItem.controller.ts
│   ├── user/user.controller.ts           User CRUD + setRole
│   └── vehicle/vehicle.controller.ts
│
├── middleware/
│   ├── auth/auth.middleware.ts            checkUser, requireAuth, requireAdmin, requireSuperAdmin
│   ├── rateLimit/rateLimit.middleware.ts
│   └── sanitize/sanitize.ts
│
├── models/
│   ├── audit.model.ts                    Audit schema (30-day TTL)
│   ├── clientFile.model.ts               Client file schema
│   ├── contact.model.ts                  Contact schema
│   ├── history.model.ts                  History schema (60-day TTL)
│   ├── interventionReport.model.ts       Intervention report schema
│   ├── item.model.ts                     Item schema
│   ├── shipment.model.ts                 Shipment schema
│   ├── shipmentArchive.model.ts          Shipment archive schema
│   ├── user.model.ts                     User schema
│   └── vehicle.model.ts                  Vehicle schema
│
├── routes/
│   ├── clientFile.routes.ts
│   ├── contacts.routes.ts
│   ├── history.routes.ts                 Global history + purge
│   ├── interventionReport.routes.ts
│   ├── item.routes.ts
│   ├── shipments.routes.ts
│   ├── statistics.routes.ts
│   ├── vehicle.routes.ts
│   └── user.routes.ts
│
├── services/                          Data-access layer (Mongoose calls), one subfolder per resource
│   ├── clientFile/clientFile.service.ts
│   ├── contacts/contacts.service.ts
│   ├── interventionReport/interventionReport.service.ts
│   ├── purge/purge.service.ts             History/Audit TTL purge
│   ├── reminderVehicle/reminderVehicle.service.ts  Vehicle inspection/CT email reminders
│   ├── shipments/shipments.service.ts     Includes PDF/XLSX archive generation
│   └── vehicle/vehicle.service.ts
│
├── utils/
│   ├── audit/audit.utils.ts               Audit log (logEvent, getRecentEvents)
│   ├── errors/errors.utils.ts             Error formatting
│   ├── history/history.utils.ts           Item history (logItemCreate, logItemChanges, logItemDelete)
│   ├── mailer/mailer.ts                   Vehicle reminder emails
│   ├── response/response.utils.ts         handleError (shared 500 response helper)
│   ├── upload/upload.utils.ts             File validation + ImgBB upload
│   └── validate/validate.utils.ts         MongoDB ObjectId validation
│
├── app.ts                             Express config (middleware, routes)
├── security.test.ts                   Route-protection integration tests (supertest + app.ts)
├── index.ts                           Entry point (dotenv, DB, listen)
└── package.json
```

---

## 🔌 API Endpoints

> Base URL: `/api`. Full interactive reference (routes, auth requirements,
> request/response schemas): Swagger UI at `/api-docs` (dev only, see
> `config/swagger.ts`) — kept in sync there instead of duplicated here.

---

## 📐 Mongoose models

<details>
<summary><strong>User</strong></summary>

```typescript
{
  username: string; // required, unique, 3-30 characters
  email: string; // required, unique, validated with validator
  password: string; // required, 6-1024 chars, bcrypt hashed (salt=10)
  picture: string; // default: "./uploads/profil/random-user.png"
  position: string; // max 1024 characters
  phone: string;
  department: string; // enum: Management, Hotline, Warehouse, Installer, Site Management, "" (default: "")
  roles: string[]; // stackable enum: superadmin, admin, hotline, monteur, user (default: [])
  timestamps: true; // createdAt, updatedAt
}

// Pre-save hook: automatic password hashing
// Static method: login(email, password) → User
```

</details>

<details>
<summary><strong>Item</strong></summary>

```typescript
{
  posterId: string;
  modifierName: string; // default: ""
  name: string; // required, indexed
  quantity: number; // required, default: 0, min: 0
  supplier: string; // required, indexed
  image: string; // default: "./logo_small.jpg"
  status: string; // required, indexed
  cgKit: boolean; // Part of the CashGuard preparation
  tpvKit: boolean; // Part of the TPV preparation
  timestamps: true;
}

// Compound index: { supplier, status, name }
// Single index : { quantity }
```

</details>

<details>
<summary><strong>Contact</strong></summary>

```typescript
{
  name: string; // required
  email: string; // lowercase, trimmed
  link: string;
  picture: string; // default: "./uploads/profil/random-user.png"
  position: string; // max 1024 characters
  phone: string;
  timestamps: true;
}
```

</details>

---

## 🛡️ Authentication middleware

| Middleware          | Type                | Behavior                                                                     |
| -------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `checkUser`          | Non-blocking         | Verifies the JWT, populates `res.locals.user`, continues even without a token  |
| `requireAuth`        | 🔒 Blocking          | Requires a valid JWT → `401` otherwise                                        |
| `requireHotline`     | Hotline Blocking     | Requires `roles` to include `hotline`, `admin`, or `superadmin` → `401`/`403`  |
| `requireMonteur`     | Monteur Blocking     | Requires `roles` to include `monteur`, `admin`, or `superadmin` → `401`/`403`  |
| `requireAdmin`       | Admin Blocking       | Requires `roles` to include `admin` or `superadmin` → `401`/`403` otherwise    |
| `requireSuperAdmin`  | Superadmin Blocking  | Requires `roles` to include `superadmin` → `401`/`403` otherwise               |

> All middleware read the token from the `jwt` cookie, verify it with `TOKEN_SECRET`, then load `user.roles` (a stackable array) from the database.
> If the account's email matches `SUPERADMIN_EMAIL`, `roles` is forced to `["superadmin"]` on the fly (see `resolveUser` in `auth.middleware.ts`), without persisting that role to the database.

---

## 🖼️ Upload system

### Flow

```
📱 Client (FormData + file)
  ↓
📁 Multer (memory storage, buffer)
  ↓
✅ Validation (MIME type + size < 2.5 MB)
  ↓
☁️ Upload to ImgBB (base64)
  ↓
💾 Public URL saved to the database
```

### Constraints

| Rule              | Value                                  |
| ------------------ | --------------------------------------- |
| 🖼️ Accepted types  | `image/jpg`, `image/jpeg`, `image/png`  |
| 📏 Max size        | 2.5 MB                                  |
| ☁️ Storage         | No local files - everything on ImgBB    |

### Controllers

| Controller                    | Route                        | Model              |
| ----------------------------- | ---------------------------- | ------------------ |
| `upload.controller.ts`        | `POST /api/user/upload`      | `User.picture`     |
| `uploadItem.controller.ts`    | `POST /api/item/upload`      | `Item.image`       |
| `uploadContact.controller.ts` | `POST /api/contacts/upload`  | `Contact.picture`  |

---

## ❌ Error handling

`errors.utils.ts` provides structured formatting functions:

| Function                        | Returns                                         | Use case                            |
| -------------------------------- | ----------------------------------------------- | ------------------------------------ |
| `signUpErrors(err)`              | `{ username, email, password }`                 | Registration (validation + duplicates) |
| `signInErrors(err)`              | `{ email, password }`                           | Login                                |
| `createItemErrors(err)`          | `{ name, supplier, status, quantity }`          | Item creation                        |
| `uploadErrors(err, mime, name)`  | `{ format, maxSize }`                           | File upload                          |

---

## 🔒 Security

| Layer              | Implementation                                          |
| ------------------- | --------------------------------------------------------- |
| **HTTP headers**    | Helmet (CSP disabled for compatibility)                    |
| **CORS**            | Origin restricted to `CLIENT_URL`, credentials enabled     |
| **Passwords**       | Bcrypt with salt factor 10                                 |
| **Auth**            | JWT httpOnly cookie (maxAge: 1h)                            |
| **Authorization**   | Role-based middleware (`requireAuth`, `requireAdmin`)      |
| **Validation**      | MongoDB ObjectId checked, email validated                  |
| **Compression**     | Gzip enabled on all responses                               |

---

## 🌐 CORS configuration

```typescript
{
  origin: process.env.CLIENT_URL,
  credentials: true,
  allowedHeaders: ["Content-Type", "sessionID"],
  exposedHeaders: ["sessionID"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false
}
```

---

## 🔧 Environment variables

> File: `config/.env`

| Variable            | Description                | Example                  |
| ------------------- | --------------------------- | ------------------------- |
| `PORT`              | Listening port              | `4000`                    |
| `DB_USER_PASS`      | MongoDB Atlas credentials   | `user:password`           |
| `MONGO_HOST`        | MongoDB Atlas SRV hostname  | `cluster.mongodb.net`     |
| `CLIENT_URL`        | Frontend URL (CORS)         | `http://localhost:4200`   |
| `TOKEN_SECRET`      | Secret for signing JWTs     | `mon_secret_jwt`          |
| `IMGBB_API_KEY`     | ImgBB API key                | `abc123...`                |
| `RESEND_API_KEY`    | Resend API key (emails)      | `re_...`                   |
| `SUPERADMIN_EMAIL`  | Superadmin email             | `admin@example.com`        |
| `CAMERA_HOST`       | Surveillance camera host IP  | `80.14.140.205`            |
| `CAMERA_USERNAME`   | Surveillance camera username | `root`                      |
| `CAMERA_PASSWORD`   | Surveillance camera password | `********`                  |

> In production (o2switch), the variables are set directly on the host. The `.env` file is only loaded if `CLIENT_URL` is not already defined.

---

## 🌿 Database

|              | Detail                                                                |
| ------------ | ----------------------------------------------------------------------- |
| **Service**  | MongoDB Atlas                                                          |
| **Cluster**  | `&lt;cluster&gt;.mongodb.net`                                          |
| **Database** | `Anamarcol`                                                            |
| **URI**      | `mongodb+srv://<DB_USER_PASS>@&lt;cluster&gt;.mongodb.net/Anamarcol`   |

---

## 📜 Scripts

```bash
npm run dev         # Development (nodemon + ts-node)
npm run build       # TypeScript compilation → dist/
npm start           # Run the build (dist/index.js)
npm test            # Vitest tests
npm run test:ci     # Tests + coverage (CI)
```

---

## 🧪 Tests

|                 | Detail                          |
| --------------- | --------------------------------- |
| **Framework**   | Vitest                            |
| **HTTP**        | Supertest                         |
| **Location**    | Colocated next to each source file (`x.ts` + `x.test.ts`, no `__tests__/`) |
| **Coverage**    | Controllers, middleware, services, utils |

### Test files

| File                                                          | Coverage                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------ |
| `controllers/audit/audit.controller.test.ts`                  | `getHistory`, `purgeAllHistoryAndAudit`                            |
| `controllers/auth/auth.controller.test.ts`                    | Register, login, logout                                             |
| `controllers/clientFile/clientFile.controller.test.ts`        | Client file CRUD                                                     |
| `controllers/contacts/contacts.controller.test.ts`            | Contact CRUD                                                         |
| `controllers/history/history.controller.test.ts`              | Global history                                                       |
| `controllers/interventionReport/interventionReport.controller.test.ts` | Intervention report CRUD                                    |
| `controllers/item/item.controller.test.ts`                    | Item CRUD + `preparationBatch`                                             |
| `controllers/reminder/reminder.controller.test.ts`            | Vehicle reminder trigger endpoint                                    |
| `controllers/shipments/shipments.controller.test.ts`          | Shipment CRUD                                                        |
| `controllers/stats/stats.controller.test.ts`                  | Dashboard and statistics                                             |
| `controllers/user/user.controller.test.ts`                    | User CRUD + `setRole`                                                |
| `middleware/auth/auth.middleware.test.ts`                     | `checkUser`, `requireAuth`, `requireAdmin`, `requireSuperAdmin`     |
| `services/clientFile/clientFile.service.test.ts`              | Client file data-access layer                                        |
| `services/contacts/contacts.service.test.ts`                  | Contact data-access layer                                            |
| `services/interventionReport/interventionReport.service.test.ts` | Intervention report data-access layer                             |
| `services/reminderVehicle/reminderVehicle.service.test.ts`    | Reminder due-date logic + email sending                              |
| `services/shipments/shipments.service.test.ts`                | Shipment data-access + PDF/XLSX archive generation                   |
| `services/vehicle/vehicle.service.test.ts`                    | Vehicle data-access layer                                            |
| `utils/audit/audit.utils.test.ts`                             | Audit functions                                                      |
| `utils/errors/errors.utils.test.ts`                           | Error formatting functions                                           |
| `utils/history/history.utils.test.ts`                         | History functions                                                    |
| `utils/response/response.utils.test.ts`                       | `handleError` helper                                                 |
| `utils/validate/validate.utils.test.ts`                       | ObjectId validation                                                  |
| `constants/index.test.ts`                                     | Shared constants                                                     |
| `security.test.ts`                                            | Helmet headers, rate limiting                                        |

Missing: `vehicle.controller.ts`, `camera.controller.ts`, `upload*.controller.ts`, `purge.service.ts`, `scheduler/reminder.scheduler.ts`.

---

## 🔄 CI

Tested in `.github/workflows/ci.yml` (job `test-server`, in parallel with the frontend and E2E jobs). Deployed to production via `deploy.yml` (`tsc` build + FTP to o2switch, followed by a warm-up request to absorb the Passenger cold start).
