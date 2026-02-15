<div align="center">

# 📦 Stock Anamarcol

**Application de gestion de stock interne pour Anamarcol**

Suivi en temps réel des articles, quantités, fournisseurs et contacts.

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)

[![CI](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/ci.yml/badge.svg)](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/ci.yml)
[![Deploy](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/deploy.yml/badge.svg)](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/deploy.yml)

</div>

---

## ✨ Fonctionnalités

| | Fonctionnalité | Description |
|---|---|---|
| 📋 | **Gestion des articles** | CRUD complet, suivi des quantités, alertes stock bas |
| 🏭 | **Fournisseurs & états** | Filtres avancés par fournisseur, état (Neuf / SAV) et préparation |
| 📊 | **Tableau de bord** | Statistiques globales, par fournisseur et par état avec graphiques |
| 🔄 | **Préparations batch** | Décrémentation/incrémentation groupée (CashGuard, Caisse TPV) |
| 📜 | **Historique & audit** | Suivi des modifications articles, journal d'audit, purge superadmin |
| 📤 | **Export multi-format** | Export des articles filtrés en CSV, XLSX et PDF |
| 👥 | **Contacts** | Annuaire interne avec fiches détaillées et upload photo |
| 👤 | **Membres** | Gestion de l'équipe par pôles (Direction, Hotline, Entrepôt, Monteur, Gestion du site) |
| 🖼️ | **Upload d'images** | Photos d'articles, avatars profils et contacts via ImgBB |
| 🔐 | **Authentification** | JWT avec 3 rôles (superadmin / admin / user) et sessions sécurisées |

---

## 🏗️ Stack technique

<table>
<tr>
<td width="50%" valign="top">

### 🎨 Frontend

| Technologie | Rôle |
|---|---|
| **React 19** | Interface utilisateur |
| **TypeScript** | Typage statique |
| **Vite** | Bundler & dev server |
| **Redux Toolkit** | State management |
| **React Router 7** | Routing SPA |
| **Tailwind CSS** | Styling utilitaire |
| **Framer Motion** | Animations |
| **Recharts** | Graphiques |
| **Radix UI** | Composants accessibles |
| **Lucide** | Icônes |

</td>
<td width="50%" valign="top">

### ⚙️ Backend

| Technologie | Rôle |
|---|---|
| **Node.js 20** | Runtime |
| **Express 5** | Framework HTTP |
| **TypeScript** | Typage statique |
| **MongoDB Atlas** | Base de données |
| **Mongoose 9** | ODM |
| **JWT** | Authentification |
| **Bcrypt** | Hashage mots de passe |
| **Multer** | Upload de fichiers |
| **Helmet** | Sécurité HTTP |
| **ImgBB** | Hébergement d'images |

</td>
</tr>
</table>

---

## 📁 Architecture

```
📦 Stock-Anamarcol
├── 🎨 client/                  Application React (SPA)
│   └── src/
│       ├── actions/            Actions Redux (thunks)
│       ├── components/         Composants réutilisables
│       ├── constants/          Constantes applicatives
│       ├── hooks/              Hooks personnalisés
│       ├── pages/              Pages / vues (articles, contacts, membres, historique, profil, home)
│       ├── reducers/           Reducers Redux
│       └── types/              Types TypeScript
│
├── ⚙️ server/                  API REST Express
│   ├── __tests__/              Tests unitaires (Jest)
│   ├── config/                 Configuration (DB, env, Swagger)
│   ├── controllers/            Logique métier
│   ├── middleware/             Auth, validation, rôles
│   ├── models/                 Schémas Mongoose (User, Item, Contact, History, Audit)
│   ├── routes/                 Définition des routes
│   └── utils/                  Upload, validation, historique, audit
│
└── 🔄 .github/workflows/      CI/CD (tests, deploy)
```

---

## 🚀 Démarrage rapide

### Prérequis

> **Node.js** >= 20.x • **npm** >= 9.x • **MongoDB Atlas** • Clé API **ImgBB**

### 1️⃣ Cloner le dépôt

```bash
git clone https://github.com/SebastienDechand/Stock-Anamarcol.git
cd Stock-Anamarcol
```

### 2️⃣ Installer les dépendances

```bash
cd server && npm install
cd ../client && npm install
```

### 3️⃣ Variables d'environnement

<details>
<summary>📄 <strong>Backend</strong> — <code>server/config/.env</code></summary>

```env
PORT=4000
DB_USER_PASS=<user>:<password>
CLIENT_URL=http://localhost:3000
TOKEN_SECRET=<votre_secret_jwt>
IMGBB_API_KEY=<votre_cle_imgbb>
```

</details>

<details>
<summary>📄 <strong>Frontend</strong> — <code>client/.env.development</code></summary>

```env
VITE_API_URL=http://localhost:4000/
```

</details>

### 4️⃣ Lancer en développement

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

> 🌐 L'application est accessible sur **http://localhost:3000**

---

## 📜 Scripts

<table>
<tr>
<td width="50%" valign="top">

### 🎨 Client

| Commande | Description |
|---|---|
| `npm run dev` | 🔄 Serveur de dev Vite |
| `npm run build` | 📦 Build production → `build/` |
| `npm run preview` | 👁️ Prévisualisation build |
| `npm test` | 🧪 Tests Vitest |
| `npm run test:watch` | 🔄 Tests en watch |

</td>
<td width="50%" valign="top">

### ⚙️ Serveur

| Commande | Description |
|---|---|
| `npm run dev` | 🔄 nodemon + ts-node |
| `npm run build` | 📦 Compile TS → `dist/` |
| `npm start` | ▶️ Lance le build |
| `npm test` | 🧪 Tests Jest |
| `npm run test:ci` | 📊 Tests + couverture |

</td>
</tr>
</table>

---

## 🔄 CI/CD

Le projet utilise **GitHub Actions** avec deux workflows :

### 🧪 `ci.yml` — Intégration continue

> Déclenché sur push `main`/`develop` et PR vers `main`

```
Tests backend (Jest) → Tests frontend (Vitest) → Build production
```

### 🚀 `deploy.yml` — Déploiement

> Déclenché sur push `main` ou dispatch manuel

```
Gate (CI) → Build + FTP client → Build TS + FTP server
```

> 🏠 Hébergement : **o2switch** (FTP)

---

## 🔐 Rôles & Permissions

| Action | 👤 User | 🛡️ Admin | 👑 Superadmin |
|---|:---:|:---:|:---:|
| Voir les articles | ✅ | ✅ | ✅ |
| Modifier les quantités | ✅ | ✅ | ✅ |
| Exécuter les préparations batch | ✅ | ✅ | ✅ |
| Export CSV | ✅ | ✅ | ✅ |
| Ajouter / modifier un article | ❌ | ✅ | ✅ |
| Supprimer un article | ❌ | ✅ | ✅ |
| Gérer les contacts | ❌ | ✅ | ✅ |
| Éditer les fiches membres | ❌ | ✅ | ✅ |
| Changer l'image d'un article | ❌ | ✅ | ✅ |
| Ajouter / supprimer un membre | ❌ | ❌ | ✅ |
| Changer les rôles des utilisateurs | ❌ | ❌ | ✅ |
| Purger l'historique et l'audit | ❌ | ❌ | ✅ |

---

## 📚 Documentation détaillée

| | Document | Description |
|---|---|---|
| 🎨 | [**Client (Frontend)**](client/README.md) | Architecture React, Redux, routes, auth, styling |
| ⚙️ | [**Server (Backend)**](server/README.md) | API endpoints, modèles, middleware, sécurité |

---

## 👨‍💻 Auteur

**Sébastien Dechand** — [@SebastienDechand](https://github.com/SebastienDechand)

---

<div align="center">

*Projet interne — Tous droits réservés — **Anamarcol***

</div>
