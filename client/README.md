<div align="center">

# Stock Anamarcol — Frontend

**Application React SPA pour la gestion de stock Anamarcol**

Interface moderne, responsive et performante.

![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Redux](https://img.shields.io/badge/Redux_Toolkit-2.11-764ABC?style=flat-square&logo=redux&logoColor=white)

</div>

---

## 📦 Stack technique

| Technologie      | Version | Rôle                     |
| ---------------- | ------- | ------------------------ |
| React            | `19.2`  | Bibliothèque UI          |
| TypeScript       | `5.9`   | Typage statique          |
| Vite             | `6.3`   | Bundler & serveur de dev |
| Redux Toolkit    | `2.11`  | State management global  |
| Redux Thunk      | `3.1`   | Actions asynchrones      |
| React Router DOM | `7.13`  | Routing client           |
| Tailwind CSS     | `3.4`   | Framework CSS utilitaire |
| Axios            | `1.13`  | Client HTTP              |
| Framer Motion    | `12.x`  | Animations & transitions |
| Recharts         | `3.7`   | Graphiques / data viz    |
| Radix UI         | `-`     | Composants accessibles   |
| Lucide React     | `0.563` | Icônes SVG               |
| React Hot Toast  | `2.6`   | Notifications toast      |

---

## 🗂️ Architecture

```
client/
├── public/
│   ├── manifest.json
│   └── robots.txt
│
├── src/
│   ├── actions/                     Actions Redux (thunks Axios)
│   │   ├── clientFile.actions.ts    CRUD fiches clients
│   │   ├── contacts.action.ts
│   │   ├── interventionReport.actions.ts  CRUD rapports d'intervention
│   │   ├── item.actions.ts          CRUD article, upload image, historique
│   │   ├── items.actions.ts         Liste paginée + liste complète
│   │   ├── menu.action.ts           Toggle sidebar
│   │   ├── statistics.actions.ts
│   │   ├── user.actions.ts          Profil utilisateur courant
│   │   ├── userClient.actions.ts
│   │   ├── users.actions.ts         Liste de tous les utilisateurs
│   │   └── vehicles.actions.ts      CRUD véhicules (flotte)
│   │
│   ├── assets/                      Images statiques
│   │
│   ├── components/
│   │   ├── Delete/                  Suppression avec confirmation
│   │   ├── Logout/                  Déconnexion
│   │   ├── Modales/                 AddModale, ItemModale, ContactModale, UserModale, AddMemberModale, FiltersModal, ExportOptionsModal
│   │   ├── Sidebar/                 Navigation latérale repliable
│   │   ├── SpinnerOverlay/          Overlay de chargement
│   │   ├── Stats/                   Dashboard statistiques
│   │   ├── Topbar/                  Barre supérieure
│   │   ├── Portal.tsx               Portail React (createPortal)
│   │   ├── AppContext.tsx           Contexte d'authentification
│   │   ├── Layout.tsx               Layout (Sidebar + Topbar + Outlet)
│   │   ├── ProtectedRoute.tsx       Guard d'authentification
│   │   └── Routes.tsx               Configuration des routes
│   │
│   ├── constants/
│   │   ├── item.constants.ts        Fournisseurs, états, seuil stock bas
│   │   ├── upload.constants.ts      Taille max, types MIME acceptés
│   │   └── index.ts                 Barrel re-export
│   │
│   ├── hooks/redux.ts               useAppDispatch & useAppSelector
│   ├── lib/utils.ts                 cn() (clsx + tailwind-merge)
│   │
│   ├── pages/
│   │   ├── admin-roles/             Gestion des rôles (superadmin)
│   │   ├── articles/                Grille articles, filtres, pagination, export CSV/XLSX/PDF, prépa batch
│   │   ├── contacts/                Annuaire par catégorie
│   │   ├── envois/                  Gestion des envois et expéditions (hotline+)
│   │   ├── fiches-clients/          Fiches détaillées par client + rapports d'intervention liés (monteur+)
│   │   ├── flotte/                  Gestion des véhicules de l'entreprise (admin)
│   │   ├── history/                 Journal historique & audit, filtres, purge superadmin
│   │   ├── home/                    Dashboard / accueil
│   │   ├── login/                   Page de connexion
│   │   ├── membres/                 Équipe organisée par pôles
│   │   ├── not-found/               Page 404
│   │   ├── profil/                  Profil utilisateur (édition, avatar)
│   │   └── surveillance/            Caméras de l'entreprise en continu (admin)
│   │
│   ├── reducers/
│   │   ├── __tests__/               Tests des reducers
│   │   ├── index.ts                 combineReducers (root)
│   │   ├── clientFiles.reducer.ts
│   │   ├── contacts.reducer.ts
│   │   ├── interventionReports.reducer.ts
│   │   ├── item.reducer.ts          Article sélectionné + historique
│   │   ├── items.reducer.ts         Liste paginée (items) + liste complète (allItems)
│   │   ├── menu.reducer.ts          État sidebar
│   │   ├── statistics.reducer.ts
│   │   ├── user.reducer.ts          Utilisateur courant
│   │   ├── users.reducer.ts         Liste utilisateurs
│   │   └── vehicles.reducer.ts      Véhicules (flotte)
│   │
│   ├── types/
│   │   ├── redux.ts                 RootState, AppDispatch, AppThunk, ReduxAction
│   │   ├── user.ts                  User
│   │   ├── item.ts                  Item, History
│   │   ├── contact.ts               Contact
│   │   ├── statistics.ts            GlobalStatistics, FournisseurStats, StatisticsState
│   │   ├── state.ts                 ContactsState, ItemState, ItemsState, MenuState
│   │   ├── auth.ts                  AuthContextType
│   │   └── index.ts                 Barrel re-export
│   │
│   ├── utils/
│   │   ├── csv.utils.ts             Export CSV des articles
│   │   ├── date.utils.ts            dateParser
│   │   └── export.utils.ts          Export XLSX et PDF des articles
│   │
│   ├── App.tsx                      AuthProvider + Router
│   ├── index.tsx                    Bootstrap (Store, Axios, render)
│   └── index.css                    Styles globaux + Tailwind
│
├── index.html
├── vite.config.ts
├── tailwind.config.cjs
├── tsconfig.json
└── package.json
```

---

## 🧭 Routes

| Chemin                | Page               |   Accès    | Description                                                          |
| --------------------- | ------------------ | :--------: | --------------------------------------------------------------------- |
| `/`                   | Login              |   Public   | Connexion email + mot de passe                                        |
| `/home`               | Dashboard          |    Auth    | Statistiques et vue d'ensemble                                        |
| `/articles`           | Articles           |    Auth    | Grille articles, filtres, prépa batch, export CSV/XLSX/PDF (admin)    |
| `/profil`             | Profil             |    Auth    | Profil utilisateur, avatar, édition                                   |
| `/membres`            | Membres            |    Auth    | Équipe organisée par pôles                                            |
| `/contacts`           | Contacts           |    Auth    | Annuaire contacts par catégorie                                       |
| `/envois`             | Envois             |    Auth    | Gestion des envois (création/édition réservée hotline+)               |
| `/fiches-clients`     | Fiches clients     |    Auth    | Liste des fiches (création/édition réservée monteur+)                 |
| `/fiches-clients/:id` | Dossier client     |    Auth    | Détail fiche client + rapports d'intervention liés                    |
| `/flotte`             | Flotte véhicules   |   Admin    | Gestion et suivi des véhicules de l'entreprise                        |
| `/surveillance`       | Surveillance       |   Admin    | Affichage en continu des caméras de l'entreprise                      |
| `/history`            | Historique         |   Admin    | Journal des modifications et audit                                    |
| `/admin/roles`        | Admin — Rôles      | Superadmin | Gestion des rôles utilisateurs                                        |
| `*`                   | Not Found          |    Auth    | Page 404                                                              |

> Toutes les routes sauf `/` sont protégées par `<ProtectedRoute>` qui vérifie le JWT via `/jwtid`. `/flotte`, `/surveillance`, `/history` et `/admin/roles` sont en plus protégées par `<AdminRoute>` (le mode `superAdminOnly` restreint `/admin/roles` au superadmin).
>
> Un dossier `pages/rapports-intervention/` existe encore dans le code mais n'est plus routé : la gestion des rapports d'intervention se fait désormais depuis `/fiches-clients/:id`.

---

## 🗃️ State Management — Redux

### Store

Configuré avec `@reduxjs/toolkit` (`configureStore`), devTools désactivé en production.

### Reducers

| Reducer                      | Responsabilité                                |
| ---------------------------- | --------------------------------------------- |
| `userReducer`                | Utilisateur connecté (profil, avatar, numéro) |
| `usersReducer`               | Liste de tous les utilisateurs                |
| `itemReducer`                | Article sélectionné, quantité, info détaillée |
| `itemsReducer`               | Liste complète des articles                   |
| `contactsReducer`            | Contact sélectionné + liste                   |
| `clientFilesReducer`         | Fiches clients                                |
| `interventionReportsReducer` | Rapports d'intervention                       |
| `statisticsReducer`          | Stats globales, par fournisseur, par état     |
| `vehiclesReducer`            | Véhicules de la flotte                        |
| `menuReducer`                | État d'ouverture de la sidebar                |

> Les envois (`/envois`) ne passent pas par Redux : la page appelle directement l'API via Axios et gère son état en local (`useState`).

### Pattern des actions

Les actions asynchrones utilisent **Redux Thunk** + **Axios** :

```typescript
export const getUser = (uid: string) => {
  return (dispatch: AppDispatch) => {
    return axios
      .get(`${import.meta.env.VITE_API_URL}api/user/${uid}`)
      .then((res) => dispatch({ type: GET_USER, payload: res.data }))
      .catch((err) => console.error(err));
  };
};
```

---

## 🔐 Authentification

### Flux

```
1. Login      POST /api/user/login (email + password)
2. Cookie     Le serveur renvoie un cookie JWT httpOnly
3. Vérif      AuthProvider appelle GET /jwtid au montage
4. Contexte   UidContext fournit uid, roles[] et les flags dérivés (isAdmin, isSuperadmin, isHotline, isMonteur)
5. Guard      ProtectedRoute (+ AdminRoute pour les pages admin) redirige si non autorisé
6. Logout     GET /api/user/logout supprime le cookie
```

> Les rôles sont cumulables (`roles: Role[]`) — un utilisateur peut être `hotline` et `monteur` en même temps. `isAdmin`/`isHotline`/`isMonteur` sont `true` dès que `admin` ou `superadmin` est présent (héritage des permissions).

### Contexte (`UidContext`)

```typescript
interface AuthContextType {
  uid: string | null;
  roles: Role[]; // ex: ["user"], ["hotline", "monteur"], ["admin"]...
  isAdmin: boolean; // admin ou superadmin
  isSuperadmin: boolean;
  isHotline: boolean; // hotline, admin ou superadmin
  isMonteur: boolean; // monteur, admin ou superadmin
  isAuthLoading: boolean;
}
```

---

## 🟦 Types principaux

<details>
<summary><strong>User</strong></summary>

```typescript
interface User {
  _id: string;
  pseudo: string;
  email: string;
  picture?: string;
  poste?: string;
  numero?: string;
  pole?: string;
  roles?: Role[]; // "superadmin" | "admin" | "hotline" | "monteur" | "user" (cumulables)
  createdAt?: string;
  updatedAt?: string;
}
```

</details>

<details>
<summary><strong>Item</strong></summary>

```typescript
interface Item {
  _id: string;
  posterId: string;
  modifierName?: string;
  denomination: string;
  quantite: number;
  fournisseur: string;
  image?: string;
  etat: string; // "Neuf" | "SAV"
  prepaCG?: boolean;
  prepaCaisse?: boolean;
  prepaTPV?: boolean;
}
```

</details>

<details>
<summary><strong>Contact</strong></summary>

```typescript
interface Contact {
  _id: string;
  nom?: string;
  email?: string;
  lien?: string;
  picture?: string;
  poste?: string;
  tel?: string;
}
```

</details>

---

## 📋 Constantes

```typescript
// Fournisseurs disponibles
FOURNISSEURS = [
  "Amazon",
  "CashGuard",
  "LDLC",
  "MD Ouest",
  "Monétique et Services",
  "Oxhoo",
  "Solumag",
  "Tigra",
  "TPV Line",
  "VNE",
];

// États possibles
ETATS = ["Neuf", "SAV"];

// Contraintes upload
MAX_FILE_SIZE = 2_500_000; // 2.5 Mo
ACCEPTED_IMAGE_TYPES = ["image/jpg", "image/jpeg", "image/png"];

// Seuils
LOW_STOCK_THRESHOLD = 5;
TOKEN_MAX_AGE = 3_600_000; // 1 heure
```

---

## 🎨 Styling

### Tailwind CSS

Configuration dans `tailwind.config.cjs` :

| Élément             | Détail                                                    |
| ------------------- | --------------------------------------------------------- |
| **Couleurs custom** | `brand` (vert), `primary` (vert), `surface` (beige/crème) |
| **Police**          | Inter, system-ui, sans-serif                              |
| **Portée**          | `./index.html` et `./src/**/*.{js,jsx,ts,tsx}`            |

### Utilitaire CSS

```typescript
// lib/utils.ts — Fusion intelligente des classes Tailwind
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---

## ⚡ Configuration Vite

```typescript
{
  plugins: [react()],
  server: { port: 3000, open: true },
  build: { outDir: "build" },
  resolve: { alias: { "@": "./src" } },
  test: { globals: true, environment: "jsdom", css: true }
}
```

---

## 🌍 Variables d'environnement

| Variable       | Dev                      | Prod                               |
| -------------- | ------------------------ | ---------------------------------- |
| `VITE_API_URL` | `http://localhost:4000/` | `https://stock-api.anamarcol.com/` |

---

## 📜 Scripts

```bash
npm run dev         # Serveur de dev (port 3000)
npm run build       # Build production → build/
npm run preview     # Preview du build
npm test            # Tests Vitest
npm run test:watch  # Tests en mode watch
```

---

## 🧪 Tests

|                 | Détail                                       |
| --------------- | -------------------------------------------- |
| **Framework**   | Vitest + jsdom                               |
| **Libs**        | @testing-library/react, user-event, jest-dom |
| **Emplacement** | `src/reducers/__tests__/`                    |

```bash
npm test              # Lancer tous les tests
npm run test:watch    # Mode watch
```
