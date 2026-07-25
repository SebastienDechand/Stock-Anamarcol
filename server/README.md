<div align="center">

# ⚙️ Stock Anamarcol - Backend

**REST API for Anamarcol stock management**

Express 5 • TypeScript • MongoDB Atlas • JWT

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4.1-6E9F18?style=flat-square&logo=vitest&logoColor=white)

</div>

---

## 📦 Tech stack

| Technology    | Version | Role                                |
| ------------- | ------- | ------------------------------------ |
| Node.js       | `20.x`  | Runtime                             |
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

```
server/
├── __tests__/                        Unit tests
│   ├── audit.controller.test.ts         History & purge
│   ├── audit.utils.test.ts
│   ├── auth.controller.test.ts
│   ├── auth.middleware.test.ts          Auth + requireSuperAdmin
│   ├── clientFile.controller.test.ts
│   ├── constants.test.ts
│   ├── contacts.controller.test.ts
│   ├── errors.utils.test.ts
│   ├── history.controller.test.ts
│   ├── history.utils.test.ts
│   ├── interventionReport.controller.test.ts
│   ├── item.controller.test.ts          CRUD + prepaBatch
│   ├── security.test.ts
│   ├── shipments.controller.test.ts
│   ├── stats.controller.test.ts
│   ├── user.controller.test.ts          CRUD + setRole
│   └── validate.utils.test.ts
│
├── config/
│   ├── db.ts                             MongoDB Atlas connection
│   └── swagger.ts                        Swagger configuration (dev only)
│
├── constants/index.ts                 Shared constants
│
├── controllers/
│   ├── audit.controller.ts               Global history & purge
│   ├── auth.controller.ts                Register, login, logout
│   ├── clientFile.controller.ts          Client file CRUD
│   ├── contacts.controller.ts            Contact CRUD
│   ├── history.controller.ts
│   ├── interventionReport.controller.ts  Intervention report CRUD
│   ├── item.controller.ts                Item CRUD + prepaBatch
│   ├── shipments.controller.ts           Shipment CRUD
│   ├── stats.controller.ts               Statistics & dashboard
│   ├── upload.controller.ts              Profile avatar upload
│   ├── uploadContact.controller.ts       Contact photo upload
│   ├── uploadItem.controller.ts          Item image upload
│   └── user.controller.ts                User CRUD + setRole
│
├── middleware/
│   ├── auth.middleware.ts                checkUser, requireAuth, requireAdmin, requireSuperAdmin
│   ├── rateLimiter.ts
│   └── sanitize.ts
│
├── models/
│   ├── audit.model.ts                    Audit schema (30-day TTL)
│   ├── clientFile.model.ts               Client file schema
│   ├── contact.model.ts                  Contact schema
│   ├── history.model.ts                  History schema (30-day TTL)
│   ├── interventionReport.model.ts       Intervention report schema
│   ├── item.model.ts                     Item schema
│   ├── shipment.model.ts                 Shipment schema
│   ├── shipmentArchive.model.ts          Shipment archive schema
│   └── user.model.ts                     User schema
│
├── routes/
│   ├── clientFile.routes.ts
│   ├── contacts.routes.ts
│   ├── history.routes.ts                 Global history + purge
│   ├── interventionReport.routes.ts
│   ├── item.routes.ts
│   ├── shipments.routes.ts
│   ├── statistics.routes.ts
│   └── user.routes.ts
│
├── utils/
│   ├── audit.utils.ts                    Audit log (logEvent, getRecentEvents)
│   ├── errors.utils.ts                   Error formatting
│   ├── history.utils.ts                  Item history (logItemCreate, logItemChanges, logItemDelete)
│   ├── response.utils.ts                 handleError (shared 500 response helper)
│   ├── upload.utils.ts                   File validation + ImgBB upload
│   └── validate.utils.ts                 MongoDB ObjectId validation
│
├── app.ts                             Express config (middleware, routes)
├── index.ts                           Entry point (dotenv, DB, listen)
└── package.json
```

---

## 🔌 API Endpoints

> Base URL: `/api`

### Authentication - `/api/user`

| Method | Route       |  Auth  | Description                                          |
| ------ | ----------- | :----: | ------------------------------------------------------ |
| `POST` | `/register` | Admin  | Account creation (username, email, password)             |
| `POST` | `/login`    | Public | Login → JWT cookie                                      |
| `GET`  | `/logout`   | Public | Logout (cookie removal)                                 |

> `/register` is not self-service sign-up: only an admin can create an account.

### Users - `/api/user`

| Method   | Route        | Auth  | Description                                                     |
| -------- | ------------- | :---: | ----------------------------------------------------------------- |
| `GET`    | `/`           |  🔒   | List of all users                                                  |
| `GET`    | `/:id`        |  🔒   | User details                                                       |
| `PUT`    | `/:id`        |  🔒   | Update a user (self, or anyone if admin)                          |
| `DELETE` | `/:id`        | Admin | Delete a user                                                     |
| `PUT`    | `/:id/role`   | Admin | Change a user's single role (legacy)                              |
| `PUT`    | `/:id/roles`  | Admin | Replace a user's `roles[]` array                                  |
| `POST`   | `/upload`     |  🔒   | Upload avatar                                                     |

> `PUT /:id` allows a non-admin user to update their own profile; the fields editable outside of admin are restricted at the controller level (`user.controller.ts`), not at the route level.

### Items - `/api/item`

| Method   | Route          |    Auth     | Description                                                            |
| -------- | -------------- | :---------: | ----------------------------------------------------------------------- |
| `GET`    | `/`            |     🔒      | Paginated list + filters (search, supplier, status, lowStock, sort)     |
| `GET`    | `/:id`         |     🔒      | Item details                                                            |
| `POST`   | `/`            |     🔒      | Create an item                                                          |
| `PUT`    | `/:id`         |     🔒      | Update (name, quantity, modifierName; supplier/status require Admin)    |
| `DELETE` | `/:id`         |    Admin    | Delete an item                                                          |
| `GET`    | `/history/:id` |     🔒      | Change history of an item                                               |
| `POST`   | `/prepa-batch` |     🔒      | Batch decrement/increment for prep operations                          |
| `POST`   | `/upload`      | 🔒 + Multer | Upload item image                                                       |

> `PUT /:id` allows any authenticated user to adjust `quantity` (used by the stock +/- controls); changing `supplier` or `status` returns 403 unless the caller is Admin/Superadmin (enforced in `item.controller.ts`, not at the route level).

### History - `/api/history`

| Method | Route    |    Auth    | Description                                             |
| ------ | -------- | :--------: | --------------------------------------------------------- |
| `GET`  | `/`      |     🔒     | Log of changes and audit events (limited to 30 days)      |
| `POST` | `/purge` | Superadmin | Full purge of history + audit                             |

### Contacts - `/api/contacts`

| Method   | Route     |      Auth      | Description             |
| -------- | --------- | :------------: | ------------------------- |
| `GET`    | `/`       |       🔒       | List of all contacts      |
| `GET`    | `/:id`    |       🔒       | Contact details           |
| `POST`   | `/`       |     Admin      | Create a contact          |
| `PUT`    | `/:id`    |     Admin      | Update a contact          |
| `DELETE` | `/:id`    |     Admin      | Delete a contact          |
| `POST`   | `/upload` | Admin + Multer | Upload contact photo      |

### Shipments - `/api/shipments`

| Method   | Route                     |  Auth   | Description                        |
| -------- | -------------------------- | :-----: | ------------------------------------ |
| `GET`    | `/`                         |   🔒    | List of shipments                    |
| `GET`    | `/archives`                 |  Admin  | List of archived shipments           |
| `GET`    | `/archives/:id/download`    |  Admin  | Download an archive                  |
| `POST`   | `/`                         | Hotline | Create a shipment                    |
| `POST`   | `/archive`                  |  Admin  | Archive a shipment                   |
| `PUT`    | `/:id/sent`                 | Hotline | Mark a shipment as sent              |
| `DELETE` | `/:id`                      |  Admin  | Delete a shipment                    |

### Client files - `/api/client-files`

| Method   | Route                       |  Auth   | Description                 |
| -------- | ----------------------------- | :-----: | ----------------------------- |
| `GET`    | `/`                            |   🔒    | List of client files          |
| `GET`    | `/:id`                         |   🔒    | Client file details           |
| `POST`   | `/`                            | Monteur | Create a client file          |
| `PUT`    | `/:id`                         | Monteur | Update a client file          |
| `POST`   | `/:id/documents`               | Monteur | Upload a linked document      |
| `DELETE` | `/:id/documents/:docId`        | Monteur | Delete a document              |
| `DELETE` | `/:id`                         |  Admin  | Delete a client file           |

### Intervention reports - `/api/intervention-reports`

| Method   | Route  |  Auth   | Description            |
| -------- | ------ | :-----: | ------------------------ |
| `GET`    | `/`    |   🔒    | List of reports          |
| `GET`    | `/:id` |   🔒    | Report details           |
| `POST`   | `/`    | Monteur | Create a report          |
| `PUT`    | `/:id` | Monteur | Update a report          |
| `DELETE` | `/:id` |  Admin  | Delete a report          |

### Statistics - `/api/statistics`

| Method | Route                        | Auth | Description                                     |
| ------ | ----------------------------- | :--: | -------------------------------------------------- |
| `GET`  | `/dashboard`                 |  🔒  | Unified dashboard (all stats, **30s cache**)       |
| `GET`  | `/articles`                  |  🔒  | Total number of items                              |
| `GET`  | `/stock`                     |  🔒  | Total stock                                        |
| `GET`  | `/suppliers`               |  🔒  | Number of suppliers                                |
| `GET`  | `/articles/stockinf5`        |  🔒  | Number of items with low stock                     |
| `GET`  | `/articles/low-stock`        |  🔒  | List of low-stock items                            |
| `GET`  | `/suppliers/list`         |  🔒  | List of suppliers                                  |
| `GET`  | `/suppliers/:supplier`  |  🔒  | Stats by supplier                                  |
| `GET`  | `/statuses/list`                 |  🔒  | List of statuses                                   |
| `GET`  | `/statuses/:status`                |  🔒  | Stats by status                                    |

### JWT - `/jwtid`

| Method | Route    | Auth | Description                                    |
| ------ | -------- | :--: | -------------------------------------------- |
| `GET`  | `/jwtid` |  🔒  | Returns `{ _id, role }` from the JWT cookie   |

> **Legend:** Public • 🔒 `requireAuth` • Hotline `requireHotline` • Monteur `requireMonteur` • Admin `requireAdmin` • Superadmin `requireSuperAdmin` • Multer (upload)

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
  cgKit: boolean; // Part of the CashGuard prep
  prepaCaisse: boolean; // Part of the Caisse prep
  tpvKit: boolean; // Part of the TPV prep
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
| **Location**    | `__tests__/`                      |
| **Coverage**    | Controllers, middleware, utils    |

### Test files

| File                                     | Coverage                                                         |
| ----------------------------------------- | ------------------------------------------------------------------ |
| `audit.controller.test.ts`               | `getHistory`, `purgeAllHistoryAndAudit`                            |
| `audit.utils.test.ts`                    | Audit functions                                                     |
| `auth.controller.test.ts`                | Register, login, logout                                             |
| `auth.middleware.test.ts`                | `checkUser`, `requireAuth`, `requireAdmin`, `requireSuperAdmin`     |
| `clientFile.controller.test.ts`          | Client file CRUD                                                     |
| `constants.test.ts`                      | Shared constants                                                     |
| `contacts.controller.test.ts`            | Contact CRUD                                                         |
| `errors.utils.test.ts`                   | Error formatting functions                                          |
| `history.controller.test.ts`             | Global history                                                       |
| `history.utils.test.ts`                  | History functions                                                    |
| `interventionReport.controller.test.ts`  | Intervention report CRUD                                             |
| `item.controller.test.ts`                | Item CRUD + `prepaBatch`                                             |
| `security.test.ts`                       | Helmet headers, rate limiting                                        |
| `shipments.controller.test.ts`           | Shipment CRUD                                                        |
| `stats.controller.test.ts`               | Dashboard and statistics                                             |
| `user.controller.test.ts`                | User CRUD + `setRole`                                                |
| `validate.utils.test.ts`                 | ObjectId validation                                                  |
