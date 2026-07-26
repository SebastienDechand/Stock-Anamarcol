import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../app";
import UserModel from "../../models/user.model";
import { Role } from "../../constants";
import { ErrorCode } from "../../constants/errorCodes";
import { connectTestDb, disconnectTestDb } from "../../utils/testDb/testDb.utils";
import { seedUserAndLogin, setCookieHeader } from "../../utils/testAuth/testAuth.utils";

// Real HTTP + real in-memory MongoDB (no vi.mock on user.model), unlike the
// mocked auth.controller.test.ts - exercises real bcrypt hashing, real
// Mongoose unique/validation errors, and the real JWT cookie round-trip.
describe("Auth flow (integration)", () => {
  let adminId: string;
  let userId: string;
  let adminCookie: string[];
  let userCookie: string[];

  beforeAll(async () => {
    await connectTestDb();

    const admin = await seedUserAndLogin(app, {
      username: "admin_it",
      email: "admin_it@test.com",
      password: "adminpass",
      roles: [Role.ADMIN],
    });
    adminId = admin.id;
    adminCookie = admin.cookie;

    const plainUser = await seedUserAndLogin(app, {
      username: "user_it",
      email: "user_it@test.com",
      password: "userpass",
      roles: [Role.USER],
    });
    userId = plainUser.id;
    userCookie = plainUser.cookie;
  });

  // Only the users created by individual tests are removed, so the seeded
  // admin/user (and their already-issued cookies) stay valid for the whole
  // suite - avoids re-hitting the rate-limited /login endpoint per test.
  afterEach(async () => {
    await UserModel.deleteMany({ _id: { $nin: [adminId, userId] } });
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("POST /api/user/register", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).post("/api/user/register").send({
        username: "hacker",
        email: "hacker@test.com",
        password: "123456",
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe(ErrorCode.AUTH_REQUIRED);
    });

    it("creates a new user with a hashed password and default roles, as admin", async () => {
      const res = await request(app)
        .post("/api/user/register")
        .set("Cookie", adminCookie)
        .send({ username: "newbie", email: "newbie@test.com", password: "123456" });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();

      const created = await UserModel.findById(res.body.user);
      expect(created?.roles).toEqual([Role.USER]);
      expect(created?.password).not.toBe("123456");
    });

    it("returns 403 when an authenticated non-admin tries to register a user", async () => {
      const res = await request(app)
        .post("/api/user/register")
        .set("Cookie", userCookie)
        .send({ username: "hacker2", email: "hacker2@test.com", password: "123456" });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.ACCESS_DENIED_ADMIN);
    });

    it("returns 400 with a username error on a duplicate username", async () => {
      const res = await request(app)
        .post("/api/user/register")
        .set("Cookie", adminCookie)
        .send({ username: "admin_it", email: "someoneelse@test.com", password: "123456" });

      expect(res.status).toBe(400);
      expect(res.body.errors.username).toBeTruthy();
    });

    it("returns 400 with an email error on a duplicate email", async () => {
      const res = await request(app)
        .post("/api/user/register")
        .set("Cookie", adminCookie)
        .send({ username: "someoneelse", email: "admin_it@test.com", password: "123456" });

      expect(res.status).toBe(400);
      expect(res.body.errors.email).toBeTruthy();
    });

    it("returns 400 with a password error when the password is too short", async () => {
      const res = await request(app)
        .post("/api/user/register")
        .set("Cookie", adminCookie)
        .send({ username: "shortpass", email: "shortpass@test.com", password: "12" });

      expect(res.status).toBe(400);
      expect(res.body.errors.password).toBeTruthy();
    });
  });

  describe("POST /api/user/login", () => {
    it("logs in with correct credentials and sets a jwt cookie", async () => {
      const res = await request(app)
        .post("/api/user/login")
        .send({ email: "user_it@test.com", password: "userpass" });

      expect(res.status).toBe(200);
      expect(res.body.roles).toEqual([Role.USER]);
      expect(setCookieHeader(res)[0]).toMatch(/^jwt=/);
    });

    it("returns 400 on a wrong password", async () => {
      const res = await request(app)
        .post("/api/user/login")
        .send({ email: "user_it@test.com", password: "wrongpass" });

      expect(res.status).toBe(400);
      expect(res.body.errors.password).toBeTruthy();
    });

    it("returns 400 on an unknown email", async () => {
      const res = await request(app)
        .post("/api/user/login")
        .send({ email: "ghost@test.com", password: "whatever" });

      expect(res.status).toBe(400);
      expect(res.body.errors.email).toBeTruthy();
    });
  });

  describe("GET /api/user/", () => {
    it("returns the user list to an authenticated caller", async () => {
      const res = await request(app).get("/api/user/").set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((u: { _id: string }) => u._id === adminId)).toBe(true);
    });
  });

  describe("GET /api/user/logout", () => {
    it("clears the jwt cookie", async () => {
      const res = await request(app).get("/api/user/logout");

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(ErrorCode.LOGOUT_SUCCESS);
      expect(setCookieHeader(res)[0]).toMatch(/^jwt=;/);
    });
  });
});
