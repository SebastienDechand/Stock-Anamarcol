import rateLimit from "express-rate-limit";
import { LOGIN_RATE_LIMIT_WINDOW_MS, LOGIN_RATE_LIMIT_MAX } from "../constants";

// Throttles login attempts per IP to slow down brute-force credential guessing
export const loginRateLimiter = rateLimit({
  windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
  limit: LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de tentatives, réessayez plus tard" },
});
