import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../app";
import ShipmentModel from "../../models/shipment.model";
import { Role } from "../../constants";
import { ErrorCode } from "../../constants/errorCodes";
import { connectTestDb, disconnectTestDb } from "../../utils/testDb/testDb.utils";
import { seedUserAndLogin } from "../../utils/testAuth/testAuth.utils";

const VALID_SHIPMENT = {
  lastName: "Dupont",
  firstName: "Jean",
  address: "1 rue de la Paix",
  postalCode: "75000",
  city: "Paris",
  companyOrRole: "Gérant",
  company: "SARL Dupont",
  part: "Cassette CashGuard",
};

describe("Shipments flow (integration)", () => {
  let adminCookie: string[];
  let hotlineCookie: string[];
  let userCookie: string[];

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

    hotlineCookie = (
      await seedUserAndLogin(app, {
        username: "hotline_it",
        email: "hotline_it@test.com",
        password: "hotlinepass",
        roles: [Role.HOTLINE],
      })
    ).cookie;

    userCookie = (
      await seedUserAndLogin(app, {
        username: "user_it",
        email: "user_it@test.com",
        password: "userpass",
        roles: [Role.USER],
      })
    ).cookie;
  });

  afterEach(async () => {
    await ShipmentModel.deleteMany({});
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("POST /api/shipments/", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).post("/api/shipments/").send(VALID_SHIPMENT);
      expect(res.status).toBe(401);
    });

    it("returns 403 for an authenticated user without the hotline/admin role", async () => {
      const res = await request(app)
        .post("/api/shipments/")
        .set("Cookie", userCookie)
        .send(VALID_SHIPMENT);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.ACCESS_DENIED_HOTLINE);
    });

    it("returns 400 when a required field is missing, as hotline", async () => {
      const { part: _part, ...incomplete } = VALID_SHIPMENT;
      const res = await request(app)
        .post("/api/shipments/")
        .set("Cookie", hotlineCookie)
        .send(incomplete);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(ErrorCode.SHIPMENT_MISSING_FIELDS);
    });

    it("creates a shipment as hotline, stamped with the creator", async () => {
      const res = await request(app)
        .post("/api/shipments/")
        .set("Cookie", hotlineCookie)
        .send(VALID_SHIPMENT);

      expect(res.status).toBe(201);
      expect(res.body.lastName).toBe("Dupont");
      expect(res.body.createdByName).toBe("hotline_it");
      expect(res.body.sent).toBe(false);
    });
  });

  describe("GET /api/shipments/", () => {
    it("lists shipments for any authenticated user", async () => {
      await request(app)
        .post("/api/shipments/")
        .set("Cookie", hotlineCookie)
        .send(VALID_SHIPMENT);

      const res = await request(app).get("/api/shipments/").set("Cookie", userCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe("PUT /api/shipments/:id/sent", () => {
    it("returns 403 for a non-hotline/admin authenticated user", async () => {
      const created = await ShipmentModel.create(VALID_SHIPMENT);
      const res = await request(app)
        .put(`/api/shipments/${created._id}/sent`)
        .set("Cookie", userCookie);

      expect(res.status).toBe(403);
    });

    it("marks the shipment as sent, as hotline", async () => {
      const created = await ShipmentModel.create(VALID_SHIPMENT);
      const res = await request(app)
        .put(`/api/shipments/${created._id}/sent`)
        .set("Cookie", hotlineCookie);

      expect(res.status).toBe(200);
      expect(res.body.sent).toBe(true);
      expect(res.body.sentBy).toBe("hotline_it");
    });
  });

  describe("DELETE /api/shipments/:id", () => {
    it("returns 403 for hotline (route is admin-only)", async () => {
      const created = await ShipmentModel.create(VALID_SHIPMENT);
      const res = await request(app)
        .delete(`/api/shipments/${created._id}`)
        .set("Cookie", hotlineCookie);

      expect(res.status).toBe(403);
    });

    it("deletes the shipment as admin", async () => {
      const created = await ShipmentModel.create(VALID_SHIPMENT);
      const res = await request(app)
        .delete(`/api/shipments/${created._id}`)
        .set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(ErrorCode.SHIPMENT_DELETED);

      const remaining = await ShipmentModel.findById(created._id);
      expect(remaining).toBeNull();
    });
  });
});
