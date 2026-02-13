<div align="center">

# 🎨 Stock Anamarcol — Frontend

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

| Technologie | Version | Rôle |
|---|---|---|
| ⚛️ React | `19.2` | Bibliothèque UI |
| 🟦 TypeScript | `5.9` | Typage statique |
| ⚡ Vite | `6.3` | Bundler & serveur de dev |
| 🗃️ Redux Toolkit | `2.11` | State management global |
| 🔄 Redux Thunk | `3.1` | Actions asynchrones |
| 🧭 React Router DOM | `7.13` | Routing client |
| 🎨 Tailwind CSS | `3.4` | Framework CSS utilitaire |
| 📡 Axios | `1.13` | Client HTTP |
| ✨ Framer Motion | `12.x` | Animations & transitions |
| 📊 Recharts | `3.7` | Graphiques / data viz |
| 🧩 Radix UI | `-` | Composants accessibles |
| 🎯 Lucide React | `0.563` | Icônes SVG |
| 🔔 React Hot Toast | `2.6` | Notifications toast |

---

## 🗂️ Architecture

```
📁 client/
├── 📁 public/
│   ├── 🖼️ logo_small.jpg
│   ├── 📄 manifest.json
│   └── 🤖 robots.txt
│
├── 📁 src/
│   ├── 🧪 __tests__/                   Tests unitaires globaux
│   │
│   ├── 🔌 actions/                     Actions Redux (thunks Axios)
│   │   ├── contacts.action.ts
│   │   ├── item.actions.ts              CRUD article, upload image
│   │   ├── items.actions.ts             Liste de tous les articles
│   │   ├── menu.action.ts              Toggle sidebar
│   │   ├── statistics.actions.ts
│   │   ├── user.actions.ts              Profil utilisateur courant
│   │   └── users.actions.ts             Liste de tous les utilisateurs
│   │
│   ├── 🖼️ assets/                       Images statiques
│   │
│   ├── 🧩 components/
│   │   ├── Articles/                   Grille articles, articles stock bas
│   │   ├── Delete/                     Suppression avec confirmation
│   │   ├── Filtre/                     Composant filtres
│   │   ├── Logout/                     Déconnexion
│   │   ├── Modales/                    AddModale, ItemModale, ContactModale
│   │   ├── Pagination/                 Pagination
│   │   ├── Sidebar/                    Navigation latérale repliable
│   │   ├── SpinnerOverlay/             Overlay de chargement
│   │   ├── Stats/                      Dashboard statistiques
│   │   ├── Topbar/                     Barre supérieure
│   │   ├── AppContext.tsx              🔐 Contexte d'authentification
│   │   ├── Layout.tsx                  📐 Layout (Sidebar + Topbar + Outlet)
│   │   ├── ProtectedRoute.tsx          🛡️ Guard d'authentification
│   │   └── Routes.tsx                  🧭 Configuration des routes
│   │
│   ├── 📋 constants/index.ts           Fournisseurs, états, limites, seuils
│   ├── 🪝 hooks/redux.ts               useAppDispatch & useAppSelector
│   ├── 🛠️ lib/utils.ts                 cn() (clsx + tailwind-merge)
│   │
│   ├── 📄 pages/
│   │   ├── articles/                   Page articles (grille, filtres, pagination)
│   │   ├── contacts/                   Page contacts
│   │   ├── home/                       Dashboard / accueil
│   │   ├── login/                      Page de connexion
│   │   ├── membres/                    Page membres
│   │   └── profil/                     Page profil utilisateur
│   │
│   ├── 🗃️ reducers/
│   │   ├── __tests__/                  Tests des reducers
│   │   ├── index.ts                    combineReducers (root)
│   │   ├── contacts.reducer.ts
│   │   ├── item.reducer.ts             Article sélectionné
│   │   ├── items.reducer.ts            Liste articles
│   │   ├── menu.reducer.ts             État sidebar
│   │   ├── statistics.reducer.ts
│   │   ├── user.reducer.ts             Utilisateur courant
│   │   └── users.reducer.ts            Liste utilisateurs
│   │
│   ├── 🟦 types/index.ts               Tous les types TS
│   ├── ⚛️ App.tsx                       AuthProvider + Router
│   ├── 🚀 index.tsx                     Bootstrap (Store, Axios, render)
│   ├── 🎨 index.css                     Styles globaux + Tailwind
│   └── 🛠️ Utils.ts                      dateParser, isEmpty
│
├── 📄 index.html
├── ⚙️ vite.config.ts
├── 🎨 tailwind.config.cjs
├── 📄 tsconfig.json
└── 📦 package.json
```

---

## 🧭 Routes

| Chemin | Page | Accès | Description |
|---|---|:---:|---|
| `/` | Login | 🌐 Public | Connexion email + mot de passe |
| `/home` | Dashboard | 🔒 Auth | Statistiques et vue d'ensemble |
| `/articles` | Articles | 🔒 Auth | Grille articles, filtres, +/- quantité |
| `/profil` | Profil | 🔒 Auth | Profil utilisateur, avatar |
| `/membres` | Membres | 🔒 Auth | Liste des utilisateurs |
| `/contacts` | Contacts | 🔒 Auth | Annuaire contacts |

> 🛡️ Toutes les routes sauf `/` sont protégées par `<ProtectedRoute>` qui vérifie le JWT via `/jwtid`.

---

## 🗃️ State Management — Redux

### Store

Configuré avec `@reduxjs/toolkit` (`configureStore`), devTools désactivé en production.

### Reducers

| Reducer | Responsabilité |
|---|---|
| 👤 `userReducer` | Utilisateur connecté (profil, avatar, numéro) |
| 👥 `usersReducer` | Liste de tous les utilisateurs |
| 📦 `itemReducer` | Article sélectionné, quantité, info détaillée |
| 📋 `itemsReducer` | Liste complète des articles |
| 📇 `contactsReducer` | Contact sélectionné + liste |
| 📊 `statisticsReducer` | Stats globales, par fournisseur, par état |
| 📱 `menuReducer` | État d'ouverture de la sidebar |

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
1. 📝 Login      POST /api/user/login (email + password)
2. 🍪 Cookie     Le serveur renvoie un cookie JWT httpOnly
3. 🔄 Vérif      AuthProvider appelle GET /jwtid au montage
4. 🔑 Contexte   UidContext fournit uid, role, isAdmin
5. 🛡️ Guard      ProtectedRoute redirige vers / si non auth
6. 🚪 Logout     GET /api/user/logout supprime le cookie
```

### Contexte (`UidContext`)

```typescript
interface AuthContextType {
  uid: string | null;
  role: string | null;
  isAdmin: boolean;
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
  role?: string;
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
  etat: string;           // "Neuf" | "SAV"
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
// 🏭 Fournisseurs disponibles
FOURNISSEURS = ["Amazon", "CashGuard", "LDLC", "MD Ouest",
  "Monétique et Services", "Oxhoo", "Solumag", "Tigra", "TPV Line", "VNE"]

// 📦 États possibles
ETATS = ["Neuf", "SAV"]

// 🖼️ Contraintes upload
MAX_FILE_SIZE = 2_500_000      // 2.5 Mo
ACCEPTED_IMAGE_TYPES = ["image/jpg", "image/jpeg", "image/png"]

// ⚠️ Seuils
LOW_STOCK_THRESHOLD = 5
TOKEN_MAX_AGE = 3_600_000      // 1 heure
```

---

## 🎨 Styling

### Tailwind CSS

Configuration dans `tailwind.config.cjs` :

| Élément | Détail |
|---|---|
| 🎨 **Couleurs custom** | `brand` (vert), `primary` (vert), `surface` (beige/crème) |
| ✍️ **Police** | Inter, system-ui, sans-serif |
| 📂 **Portée** | `./index.html` et `./src/**/*.{js,jsx,ts,tsx}` |

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

| Variable | 🔧 Dev | 🚀 Prod |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000/` | `https://stock-api.anamarcol.com/` |

---

## 📜 Scripts

```bash
npm run dev         # 🔄 Serveur de dev (port 3000)
npm run build       # 📦 Build production → build/
npm run preview     # 👁️ Preview du build
npm test            # 🧪 Tests Vitest
npm run test:watch  # 🔄 Tests en mode watch
```

---

## 🧪 Tests

| | Détail |
|---|---|
| 🧪 **Framework** | Vitest + jsdom |
| 📚 **Libs** | @testing-library/react, user-event, jest-dom |
| 📂 **Emplacement** | `src/__tests__/` et `src/reducers/__tests__/` |

```bash
npm test              # Lancer tous les tests
npm run test:watch    # Mode watch
```
