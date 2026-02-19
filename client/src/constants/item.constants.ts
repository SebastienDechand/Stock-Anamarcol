export const FOURNISSEURS = [
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
] as const;

export type Fournisseur = (typeof FOURNISSEURS)[number];

export const ETATS = ["Neuf", "SAV"] as const;

export type Etat = (typeof ETATS)[number];

export const LOW_STOCK_THRESHOLD = 5;

// ─── Roles ───────────────────────────────────────────
export enum Role {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  USER = "user",
  HOTLINE = "hotline",
  MONTEUR = "monteur",
}

export const ROLES = Object.values(Role);
