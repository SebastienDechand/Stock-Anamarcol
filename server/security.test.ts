import { describe, it, expect, vi, beforeAll } from "vitest";
import { Request, Response } from "express";
import mongoose from "mongoose";
import { JWT_MAX_AGE, COOKIE_MAX_AGE } from "./constants";
import { mongoSanitize } from "./middleware/sanitize/sanitize";

vi.mock("./models/user.model", () => ({
  __esModule: true,
  default: {
    create: vi.fn(),
    login: vi.fn(),
    find: vi
      .fn()
      .mockReturnValue({ select: vi.fn().mockResolvedValue([]) }),
    findById: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      }),
    }),
  },
}));

vi.mock("../utils/audit/audit.utils", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

import request from "supertest";
import app from "./app";

// Force readyState to 1 so the 503 middleware lets requests through
beforeAll(() => {
  Object.defineProperty(mongoose.connection, "readyState", {
    get: () => 1,
    configurable: true,
  });
});

describe("Security - Route protection", () => {
  // #region User routes require auth
  describe("GET /api/user/ (list all users)", () => {
    it("should return 401 without JWT", async () => {
      const res = await request(app).get("/api/user/");
      expect(res.status).toBe(401);
    });
  });
  // #endregion

  describe("GET /api/user/:id (user info)", () => {
    it("should return 401 without JWT", async () => {
      const res = await request(app).get("/api/user/507f1f77bcf86cd799439011");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/user/upload (profile picture)", () => {
    it("should return 401 without JWT", async () => {
      const res = await request(app).post("/api/user/upload");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/user/register (sign up)", () => {
    it("should return 401 without JWT (admin-only)", async () => {
      const res = await request(app).post("/api/user/register").send({
        username: "hacker",
        email: "h@h.com",
        password: "123456",
      });
      expect(res.status).toBe(401);
    });
  });

  // #region Item routes require auth
  describe("GET /api/item/ (list items)", () => {
    it("should return 401 without JWT", async () => {
      const res = await request(app).get("/api/item/");
      expect(res.status).toBe(401);
    });
  });
  // #endregion

  // #region Contacts routes require auth
  describe("GET /api/contacts/ (list contacts)", () => {
    it("should return 401 without JWT", async () => {
      const res = await request(app).get("/api/contacts/");
      expect(res.status).toBe(401);
    });
  });
  // #endregion

  // #region Statistics routes require auth
  describe("GET /api/statistics/dashboard", () => {
    it("should return 401 without JWT", async () => {
      const res = await request(app).get("/api/statistics/dashboard");
      expect(res.status).toBe(401);
    });
  });
  // #endregion

  // #region Admin-only routes return 401
  describe("DELETE /api/user/:id (delete user)", () => {
    it("should return 401 without JWT", async () => {
      const res = await request(app).delete(
        "/api/user/507f1f77bcf86cd799439011",
      );
      expect(res.status).toBe(401);
    });
  });
  // #endregion

  describe("DELETE /api/item/:id (delete item)", () => {
    it("should return 401 without JWT", async () => {
      const res = await request(app).delete(
        "/api/item/507f1f77bcf86cd799439011",
      );
      expect(res.status).toBe(401);
    });
  });
});

describe("Security - 503 when DB is down", () => {
  it("should return 503 when mongoose is disconnected", async () => {
    Object.defineProperty(mongoose.connection, "readyState", {
      get: () => 0,
      configurable: true,
    });

    const res = await request(app).get("/api/user/");
    expect(res.status).toBe(503);
    expect(res.body.message).toContain("indisponible");

    // Restore
    Object.defineProperty(mongoose.connection, "readyState", {
      get: () => 1,
      configurable: true,
    });
  });
});

describe("Security - JWT expiry constants", () => {
  it("JWT_MAX_AGE should be in seconds (1 hour = 3600)", () => {
    expect(JWT_MAX_AGE).toBe(3600);
  });

  it("COOKIE_MAX_AGE should be in milliseconds (1 hour = 3_600_000)", () => {
    expect(COOKIE_MAX_AGE).toBe(3_600_000);
  });

  it("JWT_MAX_AGE should NOT equal COOKIE_MAX_AGE (units differ)", () => {
    expect(JWT_MAX_AGE).not.toBe(COOKIE_MAX_AGE);
  });
});

describe("Security - NoSQL injection prevention", () => {
  it("should strip $gt operator from body", () => {
    const req = {
      body: { email: { $gt: "" } },
      params: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();
    mongoSanitize(req, res, next);
    expect(req.body.email).toEqual({});
    expect(next).toHaveBeenCalled();
  });

  it("should strip $ne operator from body", () => {
    const req = {
      body: { role: { $ne: "user" } },
      params: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();
    mongoSanitize(req, res, next);
    expect(req.body.role).toEqual({});
    expect(next).toHaveBeenCalled();
  });

  it("should strip nested $regex operators", () => {
    const req = {
      body: { search: { $regex: ".*", $options: "i" } },
      params: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();
    mongoSanitize(req, res, next);
    expect(req.body.search).toEqual({});
    expect(next).toHaveBeenCalled();
  });

  it("should leave clean data untouched", () => {
    const req = {
      body: { email: "user@test.com", password: "abc123" },
      params: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();
    mongoSanitize(req, res, next);
    expect(req.body).toEqual({ email: "user@test.com", password: "abc123" });
    expect(next).toHaveBeenCalled();
  });
});
