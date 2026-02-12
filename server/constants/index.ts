// ─── Fournisseurs ────────────────────────────────────
export const FOURNISSEURS = [
  "CashGuard",
  "Aures",
  "LDLC",
  "Monétique et Services",
  "Oxhoo",
  "VNE",
  "TPV Line",
  "MD Ouest",
  "Solumag",
  "Tigra",
] as const;

export type Fournisseur = (typeof FOURNISSEURS)[number];

// ─── États ───────────────────────────────────────────
export const ETATS = ["Neuf", "SAV"] as const;

export type Etat = (typeof ETATS)[number];

// ─── Upload ──────────────────────────────────────────
export const MAX_FILE_SIZE = 2_500_000; // 2.5 Mo
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
] as const;

// ─── Pagination ──────────────────────────────────────
export const LOW_STOCK_THRESHOLD = 5;

// ─── Auth ────────────────────────────────────────────
export const TOKEN_MAX_AGE = 60 * 60 * 1000; // 1 heure
