import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../app";
import VehicleModel from "../../models/vehicle.model";
import { Role } from "../../constants";
import { ErrorCode } from "../../constants/errorCodes";
import { connectTestDb, disconnectTestDb } from "../../utils/testDb/testDb.utils";
import { seedUserAndLogin } from "../../utils/testAuth/testAuth.utils";

describe("Vehicle CRUD flow (integration)", () => {
  let adminCookie: string[];
  let userCookie: string[];
  let assignableUserId: string;

  beforeAll(async () => {
    await connectTestDb();

    adminCookie = (
      await seedUserAndLogin(app, {
        username: "admin_it",
        email: "admin_it@test.com",
        password: "adminpass",
        roles: [Role.ADMIN],
      })
    ).cookie;

    const nonAdmin = await seedUserAndLogin(app, {
      username: "user_it",
      email: "user_it@test.com",
      password: "userpass",
      roles: [Role.USER],
    });
    userCookie = nonAdmin.cookie;
    assignableUserId = nonAdmin.id;
  });

  afterEach(async () => {
    await VehicleModel.deleteMany({});
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("POST /api/vehicles/", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app)
        .post("/api/vehicles/")
        .send({ brand: "mercedes", model: "vito", format: "van", licensePlate: "AB-123-CD" });

      expect(res.status).toBe(401);
    });

    it("returns 403 for a non-admin authenticated user", async () => {
      const res = await request(app)
        .post("/api/vehicles/")
        .set("Cookie", userCookie)
        .send({ brand: "mercedes", model: "vito", format: "van", licensePlate: "AB-123-CD" });

      expect(res.status).toBe(403);
    });

    it("returns 400 when a required field is missing, as admin", async () => {
      const res = await request(app)
        .post("/api/vehicles/")
        .set("Cookie", adminCookie)
        .send({ brand: "mercedes", model: "vito", format: "van" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ErrorCode.VEHICLE_MISSING_FIELDS);
    });

    it("creates a vehicle as admin, upper-casing the license plate", async () => {
      const res = await request(app)
        .post("/api/vehicles/")
        .set("Cookie", adminCookie)
        .send({ brand: "mercedes", model: "vito", format: "van", licensePlate: "ab-123-cd" });

      expect(res.status).toBe(201);
      expect(res.body.licensePlate).toBe("AB-123-CD");
    });

    it("returns 400 for an invalid mercedes model", async () => {
      const res = await request(app)
        .post("/api/vehicles/")
        .set("Cookie", adminCookie)
        .send({ brand: "mercedes", model: "navara", format: "pickup", licensePlate: "AB-123-CD" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ErrorCode.VEHICLE_INVALID_MERCEDES_MODEL);
    });

    it("returns 400 for an invalid nissan model", async () => {
      const res = await request(app)
        .post("/api/vehicles/")
        .set("Cookie", adminCookie)
        .send({ brand: "nissan", model: "vito", format: "van", licensePlate: "AB-123-CD" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ErrorCode.VEHICLE_INVALID_NISSAN_MODEL);
    });

    it("returns 400 on a duplicate license plate (real unique index)", async () => {
      await request(app)
        .post("/api/vehicles/")
        .set("Cookie", adminCookie)
        .send({ brand: "mercedes", model: "vito", format: "van", licensePlate: "AB-123-CD" });

      const res = await request(app)
        .post("/api/vehicles/")
        .set("Cookie", adminCookie)
        .send({ brand: "mercedes", model: "citan", format: "van", licensePlate: "AB-123-CD" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ErrorCode.VEHICLE_LICENSE_PLATE_DUPLICATE);
    });
  });

  describe("PUT /api/vehicles/:id", () => {
    it("assigns the vehicle to a real user and resolves their name", async () => {
      const vehicle = await VehicleModel.create({
        brand: "mercedes",
        model: "vito",
        format: "van",
        licensePlate: "AB-123-CD",
      });

      const res = await request(app)
        .put(`/api/vehicles/${vehicle._id}`)
        .set("Cookie", adminCookie)
        .send({ assignedTo: assignableUserId });

      expect(res.status).toBe(200);
      expect(res.body.assignedToName).toBe("user_it");
    });

    it("returns 404 when assigning to a non-existent user", async () => {
      const vehicle = await VehicleModel.create({
        brand: "mercedes",
        model: "vito",
        format: "van",
        licensePlate: "AB-123-CD",
      });

      const res = await request(app)
        .put(`/api/vehicles/${vehicle._id}`)
        .set("Cookie", adminCookie)
        .send({ assignedTo: "507f1f77bcf86cd799439011" });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe(ErrorCode.VEHICLE_ASSIGNED_USER_NOT_FOUND);
    });
  });

  describe("DELETE /api/vehicles/:id", () => {
    it("deletes the vehicle as admin", async () => {
      const vehicle = await VehicleModel.create({
        brand: "mercedes",
        model: "vito",
        format: "van",
        licensePlate: "AB-123-CD",
      });

      const deleteRes = await request(app)
        .delete(`/api/vehicles/${vehicle._id}`)
        .set("Cookie", adminCookie);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.code).toBe(ErrorCode.VEHICLE_DELETED);

      const getRes = await request(app)
        .get(`/api/vehicles/${vehicle._id}`)
        .set("Cookie", adminCookie);
      expect(getRes.status).toBe(404);
    });
  });
});
