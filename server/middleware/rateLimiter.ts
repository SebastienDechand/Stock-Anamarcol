import rateLimit from "express-rate-limit";

/** General API: 100 requests per 15 min per IP */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de requêtes, réessayez dans quelques minutes" },
});

/**
 * Auth endpoints: 7 failed attempts per 15 min per IP.
 * Successful requests (2xx) do NOT count toward the limit.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 7,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de tentatives, réessayez dans 15 minutes" },
});
