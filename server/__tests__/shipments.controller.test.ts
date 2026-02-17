import { Request, Response } from "express";

const mockShipmentModel = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn(),
  deleteMany: jest.fn(),
};

const mockShipmentArchiveModel = {
  find: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

jest.mock("../models/shipment.model", () => ({
  __esModule: true,
  default: mockShipmentModel,
}));

jest.mock("../models/shipmentArchive.model", () => ({
  __esModule: true,
  default: mockShipmentArchiveModel,
}));

import { EventEmitter } from "events";

jest.mock("pdfkit", () => {
  return jest.fn().mockImplementation(() => {
    const emitter = new EventEmitter() as any;
    emitter.fontSize = jest.fn().mockReturnValue(emitter);
    emitter.fillColor = jest.fn().mockReturnValue(emitter);
    emitter.text = jest.fn().mockReturnValue(emitter);
    emitter.moveDown = jest.fn().mockReturnValue(emitter);
    emitter.rect = jest.fn().mockReturnValue(emitter);
    emitter.fill = jest.fn().mockReturnValue(emitter);
    emitter.font = jest.fn().mockReturnValue(emitter);
    emitter.save = jest.fn().mockReturnValue(emitter);
    emitter.restore = jest.fn().mockReturnValue(emitter);
    emitter.addPage = jest.fn().mockReturnValue(emitter);
    emitter.heightOfString = jest.fn().mockReturnValue(10);
    emitter.page = { height: 600 };
    emitter.y = 100;
    emitter.end = jest.fn().mockImplementation(() => {
      process.nextTick(() => {
        emitter.emit("data", Buffer.from("fake-pdf"));
        emitter.emit("end");
      });
    });
    return emitter;
  });
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
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn() as unknown as Response["json"],
      setHeader: jest.fn() as unknown as Response["setHeader"],
      send: jest.fn() as unknown as Response["send"],
      end: jest.fn() as unknown as Response["end"],
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  const validBody = {
    nom: "DUPONT",
    prenom: "JEAN",
    adresse: "7 AVENUE MOZART",
    codePostal: "75016",
    ville: "PARIS",
    societeOuFonction: "BOULANGERIE",
    societe: "DUPONT SARL",
    piece: "Hooper",
  };

  describe("getShipments", () => {
    it("should return all shipments", async () => {
      // autoArchiveIfNeeded: no oldest shipment → skip
      mockShipmentModel.findOne.mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });
      const mockList = [{ _id: "s1", nom: "DUPONT" }];
      mockShipmentModel.find.mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(mockList) }),
      });
      await getShipments(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockList);
    });
  });

  describe("createShipment", () => {
    it("should return 400 when required fields are missing", async () => {
      req.body = { nom: "DUPONT" };
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
          nom: "DUPONT",
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
        save: jest.fn().mockResolvedValue({ sent: true }),
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
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      });
      await deleteShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("createArchive", () => {
    it("should return 400 when no shipments exist for current month", async () => {
      mockShipmentModel.find.mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
      });
      await createArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should archive current month shipments, purge, and return metadata", async () => {
      const now = new Date();
      const shipments = [
        {
          _id: "s1",
          nom: "DUPONT",
          prenom: "JEAN",
          sent: true,
          piece: "Hooper",
          adresse: "7 AV MOZART",
          codePostal: "75016",
          ville: "PARIS",
          societeOuFonction: "BOULANGERIE",
          societe: "DUPONT SARL",
          sentBy: "admin",
          createdByName: "admin",
          createdAt: now,
        },
      ];
      mockShipmentModel.find.mockReturnValue({
        sort: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(shipments) }),
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
        select: jest.fn().mockReturnValue({
          sort: jest
            .fn()
            .mockReturnValue({ lean: jest.fn().mockResolvedValue(archives) }),
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
        lean: jest.fn().mockResolvedValue(null),
      });
      await downloadArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should send PDF buffer", async () => {
      req.params = { id: "arc1" };
      const buf = Buffer.from("pdf-data");
      mockShipmentArchiveModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
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
  });
});
