import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { Request, Response } from "express";

const mockShipmentModel = vi.hoisted(() => ({
  find: vi.fn(),
  findOne: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
  deleteOne: vi.fn(),
  deleteMany: vi.fn(),
}));

const mockShipmentArchiveModel = vi.hoisted(() => ({
  find: vi.fn(),
  create: vi.fn(),
  findById: vi.fn(),
}));

vi.mock("../models/shipment.model", () => ({
  __esModule: true,
  default: mockShipmentModel,
}));

vi.mock("../models/shipmentArchive.model", () => ({
  __esModule: true,
  default: mockShipmentArchiveModel,
}));

const mockXLSX = vi.hoisted(() => ({
  utils: {
    json_to_sheet: vi.fn().mockReturnValue({}),
    book_new: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn(),
  },
  write: vi.fn().mockReturnValue(Buffer.from("fake-xlsx")),
}));

vi.mock("xlsx", () => mockXLSX);

import { EventEmitter } from "events";

vi.mock("pdfkit", () => {
  const PDFDocumentMock = vi.fn().mockImplementation(function () {
    const emitter = new EventEmitter() as any;
    emitter.fontSize = vi.fn().mockReturnValue(emitter);
    emitter.fillColor = vi.fn().mockReturnValue(emitter);
    emitter.text = vi.fn().mockReturnValue(emitter);
    emitter.moveDown = vi.fn().mockReturnValue(emitter);
    emitter.rect = vi.fn().mockReturnValue(emitter);
    emitter.fill = vi.fn().mockReturnValue(emitter);
    emitter.font = vi.fn().mockReturnValue(emitter);
    emitter.save = vi.fn().mockReturnValue(emitter);
    emitter.restore = vi.fn().mockReturnValue(emitter);
    emitter.addPage = vi.fn().mockReturnValue(emitter);
    emitter.heightOfString = vi.fn().mockReturnValue(10);
    emitter.page = { height: 600 };
    emitter.y = 100;
    emitter.end = vi.fn().mockImplementation(() => {
      process.nextTick(() => {
        emitter.emit("data", Buffer.from("fake-pdf"));
        emitter.emit("end");
      });
    });
    return emitter;
  });
  return { __esModule: true, default: PDFDocumentMock };
});

import {
  getShipments,
  createShipment,
  markSent,
  deleteShipment,
  createArchive,
  getArchives,
  downloadArchive,
} from "../controllers/shipments.controller";

describe("Shipments Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      locals: { user: { pseudo: "hotliner", _id: "1" } },
      status: vi.fn().mockReturnThis() as unknown as Response["status"],
      json: vi.fn() as unknown as Response["json"],
      setHeader: vi.fn() as unknown as Response["setHeader"],
      send: vi.fn() as unknown as Response["send"],
      end: vi.fn() as unknown as Response["end"],
    };
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  const validBody = {
    lastName: "DUPONT",
    firstName: "JEAN",
    address: "7 AVENUE MOZART",
    postalCode: "75016",
    city: "PARIS",
    companyOrRole: "BOULANGERIE",
    company: "DUPONT SARL",
    part: "Hooper",
  };

  describe("getShipments", () => {
    it("should return all shipments", async () => {
      // autoArchiveIfNeeded: no oldest shipment → skip
      mockShipmentModel.findOne.mockReturnValue({
        sort: vi
          .fn()
          .mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      });
      const mockList = [{ _id: "s1", lastName: "DUPONT" }];
      mockShipmentModel.find.mockReturnValue({
        sort: vi
          .fn()
          .mockReturnValue({ lean: vi.fn().mockResolvedValue(mockList) }),
      });
      await getShipments(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockList);
    });
  });

  describe("createShipment", () => {
    it("should return 400 when required fields are missing", async () => {
      req.body = { lastName: "DUPONT" };
      await createShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create and return shipment", async () => {
      req.body = { ...validBody };
      mockShipmentModel.create.mockResolvedValue({
        _id: "s2",
        ...validBody,
      });
      await createShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should accept requestDate if provided", async () => {
      const dt = "2026-02-01T10:00:00.000Z";
      req.body = { ...validBody, requestDate: dt };
      mockShipmentModel.create.mockResolvedValue({
        _id: "sB",
        ...validBody,
        requestDate: new Date(dt),
      });
      await createShipment(req as Request, res as Response);
      expect(mockShipmentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lastName: "DUPONT",
          requestDate: new Date(dt),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("markSent", () => {
    it("should return 404 when not found", async () => {
      req.params = { id: "bad" };
      mockShipmentModel.findById.mockResolvedValue(null);
      await markSent(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should mark as sent", async () => {
      req.params = { id: "s2" };
      const mockShipment: any = {
        sent: false,
        save: vi.fn().mockResolvedValue({ sent: true }),
      };
      mockShipmentModel.findById.mockResolvedValue(mockShipment);
      await markSent(req as Request, res as Response);
      expect(mockShipment.sent).toBe(true);
      expect(mockShipment.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteShipment", () => {
    it("should delete and respond 200", async () => {
      req.params = { id: "s3" };
      mockShipmentModel.deleteOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      await deleteShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("createArchive", () => {
    it("should return 400 when no shipments exist for current month", async () => {
      mockShipmentModel.find.mockReturnValue({
        sort: vi
          .fn()
          .mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      await createArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should archive current month shipments, purge, and return metadata", async () => {
      const now = new Date();
      const shipments = [
        {
          _id: "s1",
          lastName: "DUPONT",
          firstName: "JEAN",
          sent: true,
          part: "Hooper",
          address: "7 AV MOZART",
          postalCode: "75016",
          city: "PARIS",
          companyOrRole: "BOULANGERIE",
          company: "DUPONT SARL",
          sentBy: "admin",
          createdByName: "admin",
          createdAt: now,
        },
      ];
      mockShipmentModel.find.mockReturnValue({
        sort: vi
          .fn()
          .mockReturnValue({ lean: vi.fn().mockResolvedValue(shipments) }),
      });
      mockShipmentArchiveModel.create.mockResolvedValue({
        _id: "arc1",
        title: "Janvier 2026",
        periodStart: now,
        periodEnd: now,
        shipmentCount: 1,
        createdAt: now,
      });
      mockShipmentModel.deleteMany.mockResolvedValue({ deletedCount: 1 });

      await createArchive(req as Request, res as Response);
      expect(mockShipmentArchiveModel.create).toHaveBeenCalled();
      expect(mockShipmentModel.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ createdAt: expect.any(Object) }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getArchives", () => {
    it("should return archives without fileBuffer", async () => {
      const archives = [{ _id: "arc1", title: "Janvier 2026" }];
      mockShipmentArchiveModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          sort: vi
            .fn()
            .mockReturnValue({ lean: vi.fn().mockResolvedValue(archives) }),
        }),
      });
      await getArchives(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(archives);
    });
  });

  describe("downloadArchive", () => {
    it("should return 404 when archive not found", async () => {
      req.params = { id: "missing" };
      mockShipmentArchiveModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      await downloadArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should send PDF buffer", async () => {
      req.params = { id: "arc1" };
      const buf = Buffer.from("pdf-data");
      mockShipmentArchiveModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "arc1",
          title: "Janvier 2026",
          fileBuffer: buf,
        }),
      });
      await downloadArchive(req as Request, res as Response);
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/pdf",
      );
      expect(res.end).toHaveBeenCalledWith(buf);
    });

    it("should send XLSX buffer when format=xlsx", async () => {
      req.params = { id: "arc1" };
      req.query = { format: "xlsx" };
      const rawData = [{ Nom: "DUPONT", Prénom: "JEAN" }];
      mockShipmentArchiveModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "arc1",
          title: "Janvier 2026",
          rawData,
          fileBuffer: Buffer.from("pdf"),
        }),
      });
      await downloadArchive(req as Request, res as Response);
      expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalledWith(rawData);
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      expect(res.end).toHaveBeenCalled();
    });

    it("should return 400 when xlsx requested but no rawData", async () => {
      req.params = { id: "arc1" };
      req.query = { format: "xlsx" };
      mockShipmentArchiveModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "arc1",
          title: "Janvier 2026",
          rawData: [],
          fileBuffer: Buffer.from("pdf"),
        }),
      });
      await downloadArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 500 on error", async () => {
      req.params = { id: "arc1" };
      mockShipmentArchiveModel.findById.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error("DB error")),
      });
      await downloadArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("markSent – additional", () => {
    it("should set sentAt and sentBy when marking sent", async () => {
      req.params = { id: "s4" };
      const mockShipment: Record<string, unknown> = {
        sent: false,
        sentAt: undefined,
        sentBy: undefined,
        save: vi.fn().mockImplementation(function (
          this: Record<string, unknown>,
        ) {
          return Promise.resolve(this);
        }),
      };
      mockShipmentModel.findById.mockResolvedValue(mockShipment);
      await markSent(req as Request, res as Response);
      expect(mockShipment.sent).toBe(true);
      expect(mockShipment.sentAt).toBeInstanceOf(Date);
      expect(mockShipment.sentBy).toBe("hotliner");
    });

    it("should return 500 on save error", async () => {
      req.params = { id: "s5" };
      const mockShipment = {
        sent: false,
        save: vi.fn().mockRejectedValue(new Error("save fail")),
      };
      mockShipmentModel.findById.mockResolvedValue(mockShipment);
      await markSent(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createShipment – additional", () => {
    it("should return 500 on create error", async () => {
      req.body = { ...validBody };
      mockShipmentModel.create.mockRejectedValue(new Error("DB error"));
      await createShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should report all missing required fields", async () => {
      req.body = {};
      await createShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      const payload = (res.json as Mock).mock.calls[0][0];
      expect(payload.message).toContain("lastName");
      expect(payload.message).toContain("firstName");
      expect(payload.message).toContain("part");
    });
  });

  describe("deleteShipment – additional", () => {
    it("should return 500 on delete error", async () => {
      req.params = { id: "s6" };
      mockShipmentModel.deleteOne.mockReturnValue({
        exec: vi.fn().mockRejectedValue(new Error("delete fail")),
      });
      await deleteShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getShipments – additional", () => {
    it("should return 500 on error", async () => {
      mockShipmentModel.findOne.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockRejectedValue(new Error("fail")),
        }),
      });
      await getShipments(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getArchives – additional", () => {
    it("should return 500 on error", async () => {
      mockShipmentArchiveModel.find.mockReturnValue({
        select: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            lean: vi.fn().mockRejectedValue(new Error("fail")),
          }),
        }),
      });
      await getArchives(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createArchive – additional", () => {
    it("should return 500 on error", async () => {
      mockShipmentModel.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockRejectedValue(new Error("fail")),
        }),
      });
      await createArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
