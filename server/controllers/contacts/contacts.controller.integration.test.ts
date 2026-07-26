import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "../../app";
import ContactModel from "../../models/contact.model";
import { Role } from "../../constants";
import { ErrorCode } from "../../constants/errorCodes";
import { connectTestDb, disconnectTestDb } from "../../utils/testDb/testDb.utils";
import { seedUserAndLogin } from "../../utils/testAuth/testAuth.utils";

describe("Contacts CRUD flow (integration)", () => {
  let adminCookie: string[];
  let userCookie: string[];
  let contactId: string;

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
    await ContactModel.deleteMany({});
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe("GET /api/contacts/", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).get("/api/contacts/");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/contacts/", () => {
    it("returns 401 without a cookie", async () => {
      const res = await request(app).post("/api/contacts/").send({ name: "Alice" });
      expect(res.status).toBe(401);
    });

    it("returns 403 for a non-admin authenticated user", async () => {
      const res = await request(app)
        .post("/api/contacts/")
        .set("Cookie", userCookie)
        .send({ name: "Alice" });

      expect(res.status).toBe(403);
    });

    it("creates a contact as admin, defaulting the category", async () => {
      const res = await request(app)
        .post("/api/contacts/")
        .set("Cookie", adminCookie)
        .send({ name: "Alice Dupont", email: "alice@test.com" });

      expect(res.status).toBe(200);
      expect(res.body.contact).toBeDefined();

      const created = await ContactModel.findById(res.body.contact);
      expect(created?.category).toBe("external");
      contactId = created!._id.toString();
    });
  });

  describe("PUT /api/contacts/:id", () => {
    it("returns 403 for a non-admin authenticated user", async () => {
      const contact = await ContactModel.create({ name: "Bob" });
      const res = await request(app)
        .put(`/api/contacts/${contact._id}`)
        .set("Cookie", userCookie)
        .send({ name: "Bob Updated" });

      expect(res.status).toBe(403);
    });

    it("updates the contact as admin", async () => {
      const contact = await ContactModel.create({ name: "Bob" });
      const res = await request(app)
        .put(`/api/contacts/${contact._id}`)
        .set("Cookie", adminCookie)
        .send({ name: "Bob Updated", category: "supplier" });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Bob Updated");
      expect(res.body.category).toBe("supplier");
    });
  });

  describe("DELETE /api/contacts/:id", () => {
    it("returns 403 for a non-admin authenticated user", async () => {
      const contact = await ContactModel.create({ name: "Charlie" });
      const res = await request(app)
        .delete(`/api/contacts/${contact._id}`)
        .set("Cookie", userCookie);

      expect(res.status).toBe(403);
    });

    it("deletes the contact as admin", async () => {
      const contact = await ContactModel.create({ name: "Charlie" });

      const deleteRes = await request(app)
        .delete(`/api/contacts/${contact._id}`)
        .set("Cookie", adminCookie);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.code).toBe(ErrorCode.DELETED);

      const getRes = await request(app)
        .get(`/api/contacts/${contact._id}`)
        .set("Cookie", adminCookie);
      expect(getRes.status).toBe(404);
    });
  });
});
