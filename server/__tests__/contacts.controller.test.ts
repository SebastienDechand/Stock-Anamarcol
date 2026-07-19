import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { Request, Response } from "express";

const mockContactModel: Record<string, Mock> = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  deleteOne: vi.fn(),
}));

vi.mock("../models/contact.model", () => ({
  __esModule: true,
  default: mockContactModel,
  // IContact re-export so the controller import works
}));

vi.mock("../utils/audit.utils", () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../utils/validate.utils", () => ({
  validateObjectId: vi.fn((id: string, res: Response) => {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      res.status(400).json({ message: "ID invalide" });
      return false;
    }
    return true;
  }),
}));

import {
  getContacts,
  contactInfo,
  createContact,
  updateContact,
  deleteContact,
} from "../controllers/contacts.controller";
import { logEvent } from "../utils/audit.utils";

describe("Contacts Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      locals: { user: { username: "admin" } },
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
      send: vi.fn() as unknown as Response["send"],
    };
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  // ── getContacts ──
  describe("getContacts", () => {
    it("should return all contacts", async () => {
      const contacts = [{ _id: "c1", name: "Dupont" }];
      mockContactModel.find.mockResolvedValue(contacts);
      await getContacts(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(contacts);
    });
  });

  // ── contactInfo ──
  describe("contactInfo", () => {
    it("should return 400 for invalid ObjectId", async () => {
      req.params = { id: "bad" };
      await contactInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when contact not found", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockContactModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      await contactInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return the contact", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      const contact = { _id: "507f1f77bcf86cd799439011", name: "Dupont" };
      mockContactModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(contact),
      });
      await contactInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(contact);
    });

    it("should return 500 on DB error", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockContactModel.findById.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error("DB error")),
      });
      await contactInfo(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── createContact ──
  describe("createContact", () => {
    it("should create a contact and log audit event", async () => {
      req.body = { name: "Dupont", email: "test@test.com" };
      mockContactModel.create.mockResolvedValue({
        _id: "c2",
        name: "Dupont",
      });
      await createContact(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ contact: "c2" });
      expect(logEvent).toHaveBeenCalledWith(
        "create",
        "contact",
        "c2",
        "admin",
        expect.objectContaining({ entityName: "Dupont" }),
      );
    });

    it("should return 400 on validation error", async () => {
      req.body = {};
      mockContactModel.create.mockRejectedValue(new Error("validation error"));
      await createContact(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── updateContact ──
  describe("updateContact", () => {
    it("should return 400 for invalid ObjectId", async () => {
      req.params = { id: "bad" };
      await updateContact(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when contact not found", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockContactModel.findById.mockResolvedValue(null);
      await updateContact(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update contact fields and audit changes", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { name: "Martin" };

      const mockContact = {
        _id: "507f1f77bcf86cd799439011",
        name: "Dupont",
        email: "old@test.com",
        toObject: vi.fn().mockReturnValue({
          _id: "507f1f77bcf86cd799439011",
          name: "Dupont",
          email: "old@test.com",
        }),
        save: vi.fn().mockImplementation(function (
          this: Record<string, unknown>,
        ) {
          return Promise.resolve(this);
        }),
      };
      mockContactModel.findById.mockResolvedValue(mockContact);
      await updateContact(req as Request, res as Response);
      expect(mockContact.name).toBe("Martin");
      expect(mockContact.save).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });

    it("should return 500 on DB error", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      req.body = { name: "Martin" };
      mockContactModel.findById.mockRejectedValue(new Error("DB error"));
      await updateContact(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── deleteContact ──
  describe("deleteContact", () => {
    it("should return 400 for invalid ObjectId", async () => {
      req.params = { id: "bad" };
      await deleteContact(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete a contact and log audit event", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      const contact = { _id: "507f1f77bcf86cd799439011", name: "Dupont" };
      mockContactModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(contact),
      });
      mockContactModel.deleteOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      await deleteContact(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(logEvent).toHaveBeenCalledWith(
        "delete",
        "contact",
        "507f1f77bcf86cd799439011",
        "admin",
        expect.objectContaining({ deleted: contact }),
      );
    });

    it("should return 500 on DB error", async () => {
      req.params = { id: "507f1f77bcf86cd799439011" };
      mockContactModel.findById.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error("DB error")),
      });
      await deleteContact(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
