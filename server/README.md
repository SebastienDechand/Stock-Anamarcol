<div align="center">

# ⚙️ Stock Anamarcol — Backend

**API REST pour la gestion de stock Anamarcol**

Express 5 • TypeScript • MongoDB Atlas • JWT

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-30.2-C21325?style=flat-square&logo=jest&logoColor=white)

</div>

---

## 📦 Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| 🟢 Node.js | `20.x` | Runtime |
| ⚡ Express | `5.2` | Framework HTTP |
| 🟦 TypeScript | `5.9` | Typage statique |
| 🍃 MongoDB Atlas | `-` | Base de données |
| 📐 Mongoose | `9.2` | ODM (Object Document Mapper) |
| 🔑 JWT | `9.0` | Authentification par token |
| 🔒 Bcrypt | `6.0` | Hashage des mots de passe |
| 📁 Multer | `2.0` | Upload de fichiers (memory storage) |
| 🖼️ ImgBB API | `-` | Hébergement d'images |
| 🛡️ Helmet | `8.1` | En-têtes de sécurité HTTP |
| 📦 Compression | `1.8` | Compression Gzip |
| 🌐 CORS | `2.8` | Politique cross-origin |
| 🍪 Cookie Parser | `1.4` | Lecture des cookies JWT |
| ✅ Validator | `13.15` | Validation des emails |

---

## 🗂️ Architecture

```
📁 server/
├── 🧪 __tests__/                        Tests unitaires
│   ├── audit.controller.test.ts         Historique & purge
│   ├── auth.middleware.test.ts          Auth + requireSuperAdmin
│   ├── errors.utils.test.ts
│   ├── item.controller.test.ts          CRUD + prepaBatch
│   └── user.controller.test.ts          CRUD + setRole
│
├── ⚙️ config/
│   ├── .env                              Variables d'environnement
│   ├── db.ts                             Connexion MongoDB Atlas
│   └── swagger.ts                        Configuration Swagger (dev only)
│
├── 📋 constants/index.ts                 Constantes partagées
│
├── 🎯 controllers/
│   ├── audit.controller.ts               Historique global & purge
│   ├── auth.controller.ts                Register, login, logout
│   ├── contacts.controller.ts            CRUD contacts
│   ├── item.controller.ts                CRUD articles + prepaBatch
│   ├── stats.controller.ts               Statistiques & dashboard
│   ├── upload.controller.ts              Upload avatar profil
│   ├── uploadContact.controller.ts       Upload photo contact
│   ├── uploadItem.controller.ts          Upload image article
│   └── user.controller.ts                CRUD users + setRole
│
├── 🛡️ middleware/
│   └── auth.middleware.ts                checkUser, requireAuth, requireAdmin, requireSuperAdmin
│
├── 📐 models/
│   ├── audit.model.ts                    Schéma Audit (TTL 30 jours)
│   ├── contact.model.ts                  Schéma Contact
│   ├── history.model.ts                  Schéma History (TTL 30 jours)
│   ├── item.model.ts                     Schéma Item
│   └── user.model.ts                     Schéma User
│
├── 🧭 routes/
│   ├── contacts.routes.ts
│   ├── history.routes.ts                 Historique global + purge
│   ├── item.routes.ts
│   ├── statistics.routes.ts
│   └── user.routes.ts
│
├── 🛠️ utils/
│   ├── audit.utils.ts                    Journal d'audit (logEvent, getRecentEvents)
│   ├── history.utils.ts                  Historique articles (logItemCreate, logItemChanges, logItemDelete)
│   ├── upload.utils.ts                   Validation fichier + upload ImgBB
│   └── validate.utils.ts                 Validation ObjectId MongoDB
│
├── 🚀 app.ts                             Config Express (middleware, routes)
├── ❌ errors.utils.ts                     Formatage des erreurs
├── 📍 index.ts                            Point d'entrée (dotenv, DB, listen)
└── 📦 package.json
```

---

## 🔌 Endpoints API

> Base URL : `/api`

### 🔐 Authentification — `/api/user`

| Méthode | Route | Auth | Description |
|---|---|:---:|---|
| `POST` | `/register` | 🌐 | Inscription (pseudo, email, password) |
| `POST` | `/login` | 🌐 | Connexion → cookie JWT |
| `GET` | `/logout` | 🌐 | Déconnexion (suppression cookie) |

### 👤 Utilisateurs — `/api/user`

| Méthode | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🌐 | Liste de tous les utilisateurs |
| `GET` | `/:id` | 🌐 | Détail d'un utilisateur |
| `POST` | `/` | 👑 | Création d'un utilisateur (**superadmin**) |
| `PUT` | `/:id` | 🌐 | Mise à jour d'un utilisateur |
| `PUT` | `/:id/role` | 👑 | Changer le rôle d'un utilisateur (**superadmin**) |
| `DELETE` | `/:id` | 🌐 | Suppression d'un utilisateur |
| `POST` | `/upload` | 📁 | Upload d'avatar (multer) |

### 📦 Articles — `/api/item`

| Méthode | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | Liste paginée + filtres (search, fournisseur, etat, lowStock, sort) |
| `GET` | `/:id` | 🔒 | Détail d'un article |
| `POST` | `/` | 🔒 | Création d'un article |
| `PUT` | `/:id` | 🔒 | Mise à jour (denomination, fournisseur, etat, quantite, modifierName) |
| `DELETE` | `/:id` | 🛡️ | Suppression d'un article (**admin**) |
| `GET` | `/history/:id` | 🔒 | Historique des modifications d'un article |
| `POST` | `/prepa-batch` | 🔒 | Décrémentation/incrémentation groupée par préparation |
| `POST` | `/upload` | 🔒📁 | Upload d'image article (multer) |

### 📜 Historique — `/api/history`

| Méthode | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | Journal des modifications et audit (limité 30 jours) |
| `POST` | `/purge` | 👑 | Purge complète historique + audit (**superadmin**) |

### 📇 Contacts — `/api/contacts`

| Méthode | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/` | 🔒 | Liste de tous les contacts |
| `GET` | `/:id` | 🔒 | Détail d'un contact |
| `POST` | `/` | 🛡️ | Création d'un contact (**admin**) |
| `PUT` | `/:id` | 🛡️ | Mise à jour d'un contact (**admin**) |
| `DELETE` | `/:id` | 🛡️ | Suppression d'un contact (**admin**) |
| `POST` | `/upload` | 🛡️📁 | Upload photo contact (**admin**, multer) |

### 📊 Statistiques — `/api/statistics`

| Méthode | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/dashboard` | 🔒 | Dashboard unifié (toutes les stats, **cache 30s**) |
| `GET` | `/articles` | 🔒 | Nombre total d'articles |
| `GET` | `/stock` | 🔒 | Stock total |
| `GET` | `/fournisseurs` | 🔒 | Nombre de fournisseurs |
| `GET` | `/articles/stockinf5` | 🔒 | Nombre d'articles en stock bas |
| `GET` | `/articles/low-stock` | 🔒 | Liste des articles en stock bas |
| `GET` | `/fournisseurs/list` | 🔒 | Liste des fournisseurs |
| `GET` | `/fournisseurs/:fournisseur` | 🔒 | Stats par fournisseur |
| `GET` | `/etats/list` | 🔒 | Liste des états |
| `GET` | `/etats/:etat` | 🔒 | Stats par état |

### 🔑 JWT — `/jwtid`

| Méthode | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/jwtid` | 🔒 | Retourne `{ _id, role }` depuis le cookie JWT |

> **Légende :** 🌐 Public • 🔒 `requireAuth` • 🛡️ `requireAdmin` • 👑 `requireSuperAdmin` • 📁 Multer

---

## 📐 Modèles Mongoose

<details>
<summary>👤 <strong>User</strong></summary>

```typescript
{
  pseudo:    string   // ✅ requis, unique, 3-30 caractères
  email:     string   // ✅ requis, unique, validé par validator
  password:  string   // ✅ requis, 6-1024 chars, hashé bcrypt (salt=10)
  picture:   string   // 📷 défaut: "./uploads/profil/random-user.png"
  poste:     string   // max 1024 caractères
  numero:    string
  pole:      string   // Pôle de l'équipe (Direction, Hotline, Entrepôt, Monteur, Gestion du site)
  role:      string   // "admin" | "user" (défaut: "user")
  timestamps: true    // createdAt, updatedAt
}

// 🔒 Hook pre-save : hashage automatique du mot de passe
// 🔑 Méthode statique : login(email, password) → User
```

</details>

<details>
<summary>📦 <strong>Item</strong></summary>

```typescript
{
  posterId:      string
  modifierName:  string   // défaut: ""
  denomination:  string   // ✅ requis, indexé
  quantite:      number   // ✅ requis, défaut: 0, min: 0
  fournisseur:   string   // ✅ requis, indexé
  image:         string   // 📷 défaut: "./logo_small.jpg"
  etat:          string   // ✅ requis, indexé
  prepaCG:       boolean  // Fait partie de la prépa CashGuard
  prepaCaisse:   boolean  // Fait partie de la prépa Caisse
  prepaTPV:      boolean  // Fait partie de la prépa TPV
  timestamps: true
}

// 📇 Index composé : { fournisseur, etat, denomination }
// 📇 Index simple  : { quantite }
```

</details>

<details>
<summary>📇 <strong>Contact</strong></summary>

```typescript
{
  nom:      string   // ✅ requis
  email:    string   // lowercase, trimmed
  lien:     string
  picture:  string   // 📷 défaut: "./uploads/profil/random-user.png"
  poste:    string   // max 1024 caractères
  tel:      string
  timestamps: true
}
```

</details>

---

## 🛡️ Middleware d'authentification

| Middleware | Type | Comportement |
|---|---|---|
| `checkUser` | ✅ Non-bloquant | Vérifie le JWT, peuple `res.locals.user`, continue même sans token |
| `requireAuth` | 🔒 Bloquant | Exige un JWT valide → `401` sinon |
| `requireAdmin` | 🛡️ Bloquant | Exige JWT + `role === "admin"` ou superadmin → `401`/`403` sinon |
| `requireSuperAdmin` | 👑 Bloquant | Exige JWT + email === `SUPERADMIN_EMAIL` → `401`/`403` sinon |

> 🍪 Tous les middlewares lisent le token depuis le cookie `jwt` et vérifient avec `TOKEN_SECRET`.
> 👑 Le superadmin est déterminé par la variable d'environnement `SUPERADMIN_EMAIL`.

---

## 🖼️ Système d'upload

### Flux

```
📱 Client (FormData + file)
  ↓
📁 Multer (memory storage, buffer)
  ↓
✅ Validation (type MIME + taille < 2.5 Mo)
  ↓
☁️ Upload vers ImgBB (base64)
  ↓
💾 URL publique sauvée en BDD
```

### Contraintes

| Règle | Valeur |
|---|---|
| 🖼️ Types acceptés | `image/jpg`, `image/jpeg`, `image/png` |
| 📏 Taille max | 2.5 Mo |
| ☁️ Stockage | Aucun fichier local — tout sur ImgBB |

### Controllers

| Controller | Route | Modèle |
|---|---|---|
| `upload.controller.ts` | `POST /api/user/upload` | `User.picture` |
| `uploadItem.controller.ts` | `POST /api/item/upload` | `Item.image` |
| `uploadContact.controller.ts` | `POST /api/contacts/upload` | `Contact.picture` |

---

## ❌ Gestion des erreurs

`errors.utils.ts` fournit des fonctions de formatage structuré :

| Fonction | Retour | Cas d'usage |
|---|---|---|
| `signUpErrors(err)` | `{ pseudo, email, password }` | Inscription (validation + doublons) |
| `signInErrors(err)` | `{ email, password }` | Connexion |
| `createItemErrors(err)` | `{ denomination, fournisseur, etat, quantite }` | Création d'article |
| `uploadErrors(err, mime, name)` | `{ format, maxSize }` | Upload de fichier |

---

## 🔒 Sécurité

| Couche | Implémentation |
|---|---|
| 🛡️ **En-têtes HTTP** | Helmet (CSP désactivé pour compatibilité) |
| 🌐 **CORS** | Origine restreinte à `CLIENT_URL`, credentials activés |
| 🔒 **Mots de passe** | Bcrypt avec salt factor 10 |
| 🍪 **Auth** | JWT httpOnly cookie (maxAge: 1h) |
| 👮 **Autorisation** | Middleware role-based (`requireAuth`, `requireAdmin`) |
| ✅ **Validation** | ObjectId MongoDB vérifié, email validé |
| 📦 **Compression** | Gzip activé sur toutes les réponses |

---

## 🌐 Configuration CORS

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

## 🔧 Variables d'environnement

> Fichier : `config/.env`

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port d'écoute | `4000` |
| `DB_USER_PASS` | Credentials MongoDB Atlas | `user:password` |
| `CLIENT_URL` | URL du frontend (CORS) | `http://localhost:3000` |
| `TOKEN_SECRET` | Secret pour signer les JWT | `mon_secret_jwt` |
| `IMGBB_API_KEY` | Clé API ImgBB | `abc123...` |
| `SUPERADMIN_EMAIL` | Email du superadmin | `admin@anamarcol.com` |

> 💡 En production (o2switch), les variables sont définies directement sur l'hébergeur. Le `.env` n'est chargé que si `CLIENT_URL` n'est pas déjà définie.

---

## 🍃 Base de données

| | Détail |
|---|---|
| ☁️ **Service** | MongoDB Atlas |
| 🏠 **Cluster** | `anamarcol.fa6bdkr.mongodb.net` |
| 📁 **Database** | `Anamarcol` |
| 🔗 **URI** | `mongodb+srv://<DB_USER_PASS>@anamarcol.fa6bdkr.mongodb.net/Anamarcol` |

---

## 📜 Scripts

```bash
npm run dev         # 🔄 Développement (nodemon + ts-node)
npm run build       # 📦 Compilation TypeScript → dist/
npm start           # ▶️ Lancement du build (dist/index.js)
npm test            # 🧪 Tests Jest
npm run test:ci     # 📊 Tests + couverture (CI)
```

---

## 🧪 Tests

| | Détail |
|---|---|
| 🧪 **Framework** | Jest + ts-jest |
| 📡 **HTTP** | Supertest |
| 📂 **Emplacement** | `__tests__/` |
| 📊 **Couverture** | Controllers, middleware, errors.utils |

### Fichiers de test

| Fichier | Couverture |
|---|---|
| `audit.controller.test.ts` | `getHistory`, `purgeAllHistoryAndAudit` |
| `auth.middleware.test.ts` | `checkUser`, `requireAuth`, `requireAdmin`, `requireSuperAdmin` |
| `errors.utils.test.ts` | Fonctions de formatage d'erreurs |
| `item.controller.test.ts` | CRUD articles + `prepaBatch` |
| `user.controller.test.ts` | CRUD utilisateurs + `setRole` |
