import rateLimit from "express-rate-limit";

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
