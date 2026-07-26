import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../app";
import ItemModel from "../../models/item.model";
import { Role, SUPPLIERS, STATUSES } from "../../constants";
import { ErrorCode } from "../../constants/errorCodes";
import { connectTestDb, disconnectTestDb } from "../../utils/testDb/testDb.utils";
import { seedUserAndLogin } from "../../utils/testAuth/testAuth.utils";

const VALID_SUPPLIER = SUPPLIERS[0];
const VALID_STATUS = STATUSES[0];

describe("Item CRUD flow (integration)", () => {
  let adminCookie: string[];
  let userCookie: string[];
  let itemId: string;

  beforeAll(async () => {
    await connectTestDb();

    const admin = await seedUserAndLogin(app, {
      username: "admin_it",
      email: "admin_it@test.com",
      password: "adminpass",
      roles: [Role.ADMIN],
    });
    adminCookie = admin.cookie;

    const plainUser = await seedUserAndLogin(app, {
      username: "user_it",
      email: "user_it@test.com",
      password: "userpass",
      roles: [Role.USER],
    });
    userCookie = plainUser.cookie;
  });

  beforeEach(async () => {
    const item = await ItemModel.create({
      name: "Test item",
      supplier: VALID_SUPPLIER,
      status: VALID_STATUS,
      quantity: 10,
    });
    itemId = item._id.toString();
  });

  afterEach(async () => {
    await ItemModel.deleteMany({});
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("POST /api/item/", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app)
        .post("/api/item/")
        .send({ name: "Joint", supplier: VALID_SUPPLIER, status: VALID_STATUS, quantity: 5 });

      expect(res.status).toBe(401);
    });

    it("succeeds for a non-admin authenticated user (creation has no admin gate)", async () => {
      const res = await request(app)
        .post("/api/item/")
        .set("Cookie", userCookie)
        .send({ name: "Joint", supplier: VALID_SUPPLIER, status: VALID_STATUS, quantity: 5 });

      expect(res.status).toBe(201);
      expect(res.body.item.supplier).toBe(VALID_SUPPLIER);
    });

    it("returns 400 with a supplier error for an invalid supplier", async () => {
      const res = await request(app)
        .post("/api/item/")
        .set("Cookie", userCookie)
        .send({ name: "Joint", supplier: "NotARealSupplier", status: VALID_STATUS, quantity: 5 });

      expect(res.status).toBe(400);
      expect(res.body.errors.supplier).toBeTruthy();
    });

    it("returns 400 with a status error for an invalid status", async () => {
      const res = await request(app)
        .post("/api/item/")
        .set("Cookie", userCookie)
        .send({ name: "Joint", supplier: VALID_SUPPLIER, status: "NOT_A_STATUS", quantity: 5 });

      expect(res.status).toBe(400);
      expect(res.body.errors.status).toBeTruthy();
    });
  });

  describe("PUT /api/item/:id", () => {
    it("lets a non-admin authenticated user update the quantity", async () => {
      const res = await request(app)
        .put(`/api/item/${itemId}`)
        .set("Cookie", userCookie)
        .send({ quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body.item.quantity).toBe(3);
    });

    it("returns 403 when a non-admin tries to change the supplier", async () => {
      const res = await request(app)
        .put(`/api/item/${itemId}`)
        .set("Cookie", userCookie)
        .send({ supplier: SUPPLIERS[1] });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.ACCESS_DENIED_ADMIN);
    });

    it("returns 403 when a non-admin tries to change the status", async () => {
      const res = await request(app)
        .put(`/api/item/${itemId}`)
        .set("Cookie", userCookie)
        .send({ status: STATUSES[1] });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.ACCESS_DENIED_ADMIN);
    });

    it("lets an admin change the status", async () => {
      const res = await request(app)
        .put(`/api/item/${itemId}`)
        .set("Cookie", adminCookie)
        .send({ status: STATUSES[1] });

      expect(res.status).toBe(200);
      expect(res.body.item.status).toBe(STATUSES[1]);
    });

    // Documents actual current behaviour: updateItem's catch uses the
    // generic handleError (500), unlike createItem's structured 400 via
    // createItemErrors - a real asymmetry only a real-DB test can catch.
    it("returns 500 when an admin sets an invalid supplier (real Mongoose enum validation)", async () => {
      const res = await request(app)
        .put(`/api/item/${itemId}`)
        .set("Cookie", adminCookie)
        .send({ supplier: "NotARealSupplier" });

      expect(res.status).toBe(500);
    });
  });

  describe("DELETE /api/item/:id", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).delete(`/api/item/${itemId}`);
      expect(res.status).toBe(401);
    });

    it("returns 403 for a non-admin authenticated user", async () => {
      const res = await request(app).delete(`/api/item/${itemId}`).set("Cookie", userCookie);
      expect(res.status).toBe(403);
    });

    it("deletes the item for an admin", async () => {
      const deleteRes = await request(app)
        .delete(`/api/item/${itemId}`)
        .set("Cookie", adminCookie);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.code).toBe(ErrorCode.DELETED);

      const getRes = await request(app).get(`/api/item/${itemId}`).set("Cookie", adminCookie);
      expect(getRes.status).toBe(404);
    });
  });
});
