import { Request, Response, NextFunction } from "express";

/**
 * Recursively remove keys starting with '$' and keys containing '.'
 * from an object to prevent NoSQL injection ($gt, $ne, $regex, etc.).
 *
 * express-mongo-sanitize is NOT compatible with Express 5 because
 * req.query is a read-only getter in Express 5. This custom middleware
 * sanitizes req.body and req.params (the mutable inputs).
 * req.query is safe because Mongoose casts query values and does not
 * interpret operator strings from URL params.
 */
function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  if (typeof obj === "object") {
    const clean: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = sanitize((obj as Record<string, unknown>)[key]);
    }
    return clean;
  }

  // Sanitize string values that look like operators (e.g. "{$gt: ''}")
  if (typeof obj === "string" && obj.includes("$")) {
    return obj.replace(/\$/g, "");
  }

  return obj;
}

/** Express 5-compatible NoSQL sanitization middleware */
export function mongoSanitize(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitize(req.body);
  }
  if (req.params && typeof req.params === "object") {
    // req.params is writable in Express 5
    const sanitized = sanitize(req.params) as Record<string, string>;
    for (const key of Object.keys(req.params)) {
      if (!(key in sanitized)) {
        delete req.params[key];
      } else {
        req.params[key] = sanitized[key] as string;
      }
    }
  }
  next();
}
