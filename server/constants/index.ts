// ─── Suppliers ───────────────────────────────────────
export const SUPPLIERS = [
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

export type Supplier = (typeof SUPPLIERS)[number];

// ─── Statuses ────────────────────────────────────────
export const STATUSES = ["NEW", "RMA"] as const;

export type Status = (typeof STATUSES)[number];

// ─── Upload ──────────────────────────────────────────
export const MAX_FILE_SIZE = 2_500_000; // 2.5 MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
] as const;

// ─── Pagination ──────────────────────────────────────
export const LOW_STOCK_THRESHOLD = 5;

// ─── Rate limiting ───────────────────────────────────
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min
export const LOGIN_RATE_LIMIT_MAX = 10;

// ─── Roles ───────────────────────────────────────────
export enum Role {
  SUPERADMIN = "superadmin",
  ADMIN = "admin",
  USER = "user",
  HOTLINE = "hotline",
  MONTEUR = "monteur",
}

export const ROLES = Object.values(Role);

// ─── Auth ────────────────────────────────────────────
/** JWT expiry - in seconds (for jwt.sign `expiresIn`) */
export const JWT_MAX_AGE = 60 * 60; // 1 hour = 3 600 s
/** Cookie expiry - in milliseconds (for res.cookie `maxAge`) */
export const COOKIE_MAX_AGE = 60 * 60 * 1000; // 1 hour = 3 600 000 ms
