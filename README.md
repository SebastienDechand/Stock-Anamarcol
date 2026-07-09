<div align="center">

# 📦 Stock Anamarcol

**Application de gestion de stock interne pour Anamarcol**

Suivi en temps réel des articles, quantités, fournisseurs, envois et contacts.

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)

[![CI](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/ci.yml/badge.svg)](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/ci.yml)
[![Deploy](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/deploy.yml/badge.svg)](https://github.com/SebastienDechand/Stock-Anamarcol/actions/workflows/deploy.yml)

</div>

> 🚧 **Migration en cours** : le frontend est en cours de réécriture en Angular 21 (`client-ng/`), en parallèle du frontend React (`client/`) actuellement déployé en production. Les deux couvrent les mêmes fonctionnalités et sont testés en CI ; seul `client/` est déployé sur o2switch pour le moment.

---

## ✨ Fonctionnalités

| Fonctionnalité              | Description                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------- |
| **Gestion des articles**    | CRUD complet, suivi des quantités, alertes stock bas                                   |
| **Fournisseurs & états**    | Filtres avancés par fournisseur, état (Neuf / SAV) et préparation                      |
| **Tableau de bord**         | Statistiques globales, par fournisseur et par état avec graphiques                     |
| **Préparations batch**      | Décrémentation/incrémentation groupée (CashGuard, Caisse TPV)                          |
| **Historique & audit**      | Suivi des modifications articles, journal d'audit, purge superadmin                    |
| **Export multi-format**     | Export des articles filtrés en CSV, XLSX et PDF                                        |
| **Envois**                  | Gestion des envois et expéditions avec suivi et archivage                              |
| **Fiches clients**          | Fiches détaillées par client, historique et documents associés                         |
| **Rapports d'intervention** | Création et suivi des rapports d'intervention terrain                                  |
| **Contacts**                | Annuaire interne avec fiches détaillées et upload photo                                |
| **Membres**                 | Gestion de l'équipe par pôles (Direction, Hotline, Entrepôt, Monteur, Gestion du site) |
| **Flotte véhicules**        | Gestion et suivi des véhicules de l'entreprise (réservé admin)                         |
| **Surveillance**            | Affichage en continu des caméras de l'entreprise (réservé admin)                       |
| **Upload d'images**         | Photos d'articles, avatars profils et contacts via ImgBB                               |
| **Authentification**        | JWT avec 5 rôles cumulables (superadmin / admin / hotline / monteur / user)            |

---

## 🏗️ Stack technique

<table>
<tr>
<td width="50%" valign="top">

### Frontend

| Technologie        | Rôle                   |
| ------------------ | ---------------------- |
| **React 19**       | Interface utilisateur  |
| **TypeScript**     | Typage statique        |
| **Vite**           | Bundler & dev server   |
| **Redux Toolkit**  | State management       |
| **React Router 7** | Routing SPA            |
| **Tailwind CSS**   | Styling utilitaire     |
| **Framer Motion**  | Animations             |
| **Recharts**       | Graphiques             |
| **Radix UI**       | Composants accessibles |
| **Lucide**         | Icônes                 |

</td>
<td width="50%" valign="top">

### Backend

| Technologie       | Rôle                  |
| ----------------- | --------------------- |
| **Node.js 20**    | Runtime               |
| **Express 5**     | Framework HTTP        |
| **TypeScript**    | Typage statique       |
| **MongoDB Atlas** | Base de données       |
| **Mongoose 9**    | ODM                   |
| **JWT**           | Authentification      |
| **Bcrypt**        | Hashage mots de passe |
| **Multer**        | Upload de fichiers    |
| **Helmet**        | Sécurité HTTP         |
| **ImgBB**         | Hébergement d'images  |

</td>
</tr>
</table>

---

## 📁 Architecture

```
Stock-Anamarcol
├── client/                     Application React (SPA) — déployée en production
│   └── src/
│       ├── actions/            Actions Redux (thunks)
│       ├── components/         Composants réutilisables
│       ├── constants/          Constantes applicatives
│       ├── hooks/              Hooks personnalisés
│       ├── pages/              Pages / vues
│       │   ├── admin-roles/
│       │   ├── articles/
│       │   ├── contacts/
│       │   ├── envois/
│       │   ├── fiches-clients/
│       │   ├── flotte/
│       │   ├── history/
│       │   ├── home/
│       │   ├── login/
│       │   ├── membres/
│       │   ├── not-found/
│       │   ├── profil/
│       │   └── surveillance/
│       ├── reducers/           Reducers Redux
│       └── types/              Types TypeScript
│
├── client-ng/                   Application Angular 21 (SPA) — en cours de migration
│   └── src/app/
│       ├── core/                Layout, guards, config
│       ├── features/            Un dossier par domaine (articles, contacts, envois,
│       │                        fiches-clients, flotte, history, home, membres,
│       │                        profil, rapports-intervention, surveillance,
│       │                        admin-roles, login, legal, not-found)
│       │   └── */store/         State management NgRx (store + effects) par feature
│       └── shared/              Composants, constantes, modèles partagés
│
├── server/                     API REST Express
│   ├── __tests__/              Tests unitaires (Vitest)
│   ├── config/                 Configuration (DB, Swagger)
│   ├── controllers/            Logique métier
│   ├── middleware/             Auth, validation, rôles
│   ├── models/                 Schémas Mongoose
│   ├── routes/                 Définition des routes
│   └── utils/                  Upload, validation, historique, audit
│
└── .github/workflows/          CI/CD (tests backend + client + client-ng, deploy)
```

---

## 🚀 Démarrage rapide

### Prérequis

> **Node.js** >= 18.x • **npm** >= 9.x • **MongoDB Atlas** • Clé API **ImgBB**

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
<summary><strong>Backend</strong> — <code>server/config/.env</code></summary>

```env
PORT=4000
DB_USER_PASS=<user>:<password>
CLIENT_URL=http://localhost:3000
TOKEN_SECRET=<votre_secret_jwt>
IMGBB_API_KEY=<votre_cle_imgbb>
SUPERADMIN_EMAIL=<email_superadmin>
```

</details>

<details>
<summary><strong>Frontend</strong> — <code>client/.env.development</code></summary>

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

> L'application est accessible sur **http://localhost:3000**

---

## 📜 Scripts

<table>
<tr>
<td width="33%" valign="top">

### Client (React)

| Commande             | Description                 |
| -------------------- | --------------------------- |
| `npm run dev`        | Serveur de dev Vite         |
| `npm run build`      | Build production → `build/` |
| `npm run preview`    | Prévisualisation build      |
| `npm test`           | Tests Vitest                |
| `npm run test:watch` | Tests en watch              |

</td>
<td width="33%" valign="top">

### Client (Angular)

| Commande        | Description         |
| --------------- | -------------------- |
| `npm start`     | Serveur de dev Angular |
| `npm run build` | Build production      |
| `npm test`      | Tests Vitest           |
| `npm run test:watch` | Tests en watch   |

</td>
<td width="34%" valign="top">

### Serveur

| Commande          | Description          |
| ----------------- | -------------------- |
| `npm run dev`     | nodemon + ts-node    |
| `npm run build`   | Compile TS → `dist/` |
| `npm start`       | Lance le build       |
| `npm test`        | Tests Vitest         |
| `npm run test:ci` | Tests + couverture   |

</td>
</tr>
</table>

---

## 🔄 CI/CD

Le projet utilise **GitHub Actions** avec deux workflows :

### `ci.yml` — Intégration continue

> Déclenché sur push `main`/`develop` et PR vers `main`

```
Tests backend (Vitest) ⇉ Tests frontend React (Vitest) ⇉ Tests frontend Angular (Vitest)
```

> Les 3 jobs tournent en parallèle (pas de build dans ce workflow).

### `deploy.yml` — Déploiement

> Déclenché sur push `main` ou dispatch manuel

```
Gate (CI) → Build + FTP client (React) → Build TS + FTP server
```

> Hébergement : **o2switch** (FTP) — `client-ng/` (Angular) n'est pas encore déployé.

---

## 🔐 Rôles & Permissions

> Les rôles sont cumulables (un utilisateur peut être `hotline` **et** `monteur`, par ex.). `admin` et `superadmin` héritent toujours des permissions `hotline`/`monteur`.

| Action                                       | User | Hotline | Monteur | Admin | Superadmin |
| --------------------------------------------- | :--: | :-----: | :-----: | :---: | :--------: |
| Voir les articles                             |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| Modifier les quantités                        |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| Exécuter les préparations batch               |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| Consulter les envois                          |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| Consulter les fiches clients / rapports       |  ✅  |   ✅    |   ✅    |  ✅   |     ✅     |
| Créer un envoi / le marquer envoyé            |  ❌  |   ✅    |   ❌    |  ✅   |     ✅     |
| Créer / modifier fiches clients et rapports   |  ❌  |   ❌    |   ✅    |  ✅   |     ✅     |
| Ajouter / modifier un article                 |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Supprimer un article / envoi / fiche / rapport |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Export CSV / XLSX / PDF                       |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Gérer les contacts                            |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Voir les rôles / éditer les fiches membres    |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Accéder à Flotte véhicules / Surveillance     |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Consulter l'historique et l'audit             |  ❌  |   ❌    |   ❌    |  ✅   |     ✅     |
| Ajouter / supprimer un membre                 |  ❌  |   ❌    |   ❌    |  ❌   |     ✅     |
| Changer les rôles des utilisateurs            |  ❌  |   ❌    |   ❌    |  ❌   |     ✅     |
| Purger l'historique et l'audit                |  ❌  |   ❌    |   ❌    |  ❌   |     ✅     |

---

## 📚 Documentation détaillée

| Document                                          | Description                                          |
| -------------------------------------------------- | ----------------------------------------------------- |
| [**Client React (Frontend)**](client/README.md)   | Architecture React, Redux, routes, auth, styling      |
| [**Client Angular (Frontend)**](client-ng/README.md) | Architecture Angular, NgRx, routes, guards, styling  |
| [**Server (Backend)**](server/README.md)          | API endpoints, modèles, middleware, sécurité          |

---

## 👨‍💻 Auteur

**Sébastien Dechand** — [@SebastienDechand](https://github.com/SebastienDechand)

---

<div align="center">

\*Projet interne — Tous droits réservés — **Anamarcol\***

</div>
