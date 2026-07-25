import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

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

vi.mock("pdfkit", () => {
  const PDFDocumentMock = vi.fn().mockImplementation(function () {
    const emitter = new EventEmitter() as EventEmitter & Record<string, unknown>;
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
  listShipments,
  createShipment,
  findShipmentDocument,
  deleteShipmentById,
  listArchives,
  findArchiveById,
  performArchiveForMonth,
  autoArchiveIfNeeded,
} from "../services/shipments.service";

describe("shipments.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listShipments sorts by createdAt desc and leans", async () => {
    const list = [{ _id: "s1" }];
    const lean = vi.fn().mockResolvedValue(list);
    const sort = vi.fn().mockReturnValue({ lean });
    mockShipmentModel.find.mockReturnValue({ sort });

    const result = await listShipments({ clientFile: "cf1" });

    expect(mockShipmentModel.find).toHaveBeenCalledWith({ clientFile: "cf1" });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toBe(list);
  });

  it("createShipment delegates to the model", async () => {
    const data = { lastName: "Dupont" };
    mockShipmentModel.create.mockResolvedValue({ _id: "s1", ...data });
    const result = await createShipment(data);
    expect(mockShipmentModel.create).toHaveBeenCalledWith(data);
    expect(result).toEqual({ _id: "s1", ...data });
  });

  it("findShipmentDocument delegates to findById", () => {
    const doc = { _id: "s1" };
    mockShipmentModel.findById.mockReturnValue(doc);
    expect(findShipmentDocument("s1")).toBe(doc);
  });

  it("deleteShipmentById delegates to deleteOne({ _id }).exec()", async () => {
    const exec = vi.fn().mockResolvedValue({ deletedCount: 1 });
    mockShipmentModel.deleteOne.mockReturnValue({ exec });
    await deleteShipmentById("s1");
    expect(mockShipmentModel.deleteOne).toHaveBeenCalledWith({ _id: "s1" });
    expect(exec).toHaveBeenCalled();
  });

  it("listArchives excludes fileBuffer and sorts by createdAt desc", async () => {
    const archives = [{ _id: "a1" }];
    const lean = vi.fn().mockResolvedValue(archives);
    const sort = vi.fn().mockReturnValue({ lean });
    const select = vi.fn().mockReturnValue({ sort });
    mockShipmentArchiveModel.find.mockReturnValue({ select });

    const result = await listArchives();

    expect(select).toHaveBeenCalledWith("-fileBuffer");
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toBe(archives);
  });

  it("findArchiveById leans the result", async () => {
    const archive = { _id: "a1" };
    const lean = vi.fn().mockResolvedValue(archive);
    mockShipmentArchiveModel.findById.mockReturnValue({ lean });

    const result = await findArchiveById("a1");

    expect(mockShipmentArchiveModel.findById).toHaveBeenCalledWith("a1");
    expect(result).toBe(archive);
  });

  describe("performArchiveForMonth", () => {
    it("returns null when there are no shipments for that month", async () => {
      const lean = vi.fn().mockResolvedValue([]);
      const sort = vi.fn().mockReturnValue({ lean });
      mockShipmentModel.find.mockReturnValue({ sort });

      const result = await performArchiveForMonth(2026, 0);

      expect(result).toBeNull();
      expect(mockShipmentArchiveModel.create).not.toHaveBeenCalled();
    });

    it("archives shipments into a PDF, creates the archive, and purges the month", async () => {
      const now = new Date(2026, 0, 15);
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
      const lean = vi.fn().mockResolvedValue(shipments);
      const sort = vi.fn().mockReturnValue({ lean });
      mockShipmentModel.find.mockReturnValue({ sort });
      mockShipmentArchiveModel.create.mockResolvedValue({
        _id: "arc1",
        title: "Janvier 2026",
        shipmentCount: 1,
      });
      mockShipmentModel.deleteMany.mockResolvedValue({ deletedCount: 1 });

      const archive = await performArchiveForMonth(2026, 0);

      expect(mockShipmentArchiveModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          shipmentCount: 1,
          rawData: expect.arrayContaining([
            expect.objectContaining({ Nom: "DUPONT" }),
          ]),
        }),
      );
      expect(mockShipmentModel.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ createdAt: expect.any(Object) }),
      );
      expect(archive).toEqual(
        expect.objectContaining({ _id: "arc1", shipmentCount: 1 }),
      );
    });
  });

  describe("autoArchiveIfNeeded", () => {
    it("does nothing when there are no shipments at all", async () => {
      const lean = vi.fn().mockResolvedValue(null);
      const sort = vi.fn().mockReturnValue({ lean });
      mockShipmentModel.findOne.mockReturnValue({ sort });

      await autoArchiveIfNeeded();

      expect(mockShipmentModel.find).not.toHaveBeenCalled();
    });

    it("archives every past month with shipments", async () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const oldestLean = vi.fn().mockResolvedValue({ createdAt: twoMonthsAgo });
      const oldestSort = vi.fn().mockReturnValue({ lean: oldestLean });
      mockShipmentModel.findOne.mockReturnValue({ sort: oldestSort });

      const lean = vi.fn().mockResolvedValue([]); // no shipments in any given month -> archive returns null
      const sort = vi.fn().mockReturnValue({ lean });
      mockShipmentModel.find.mockReturnValue({ sort });

      await autoArchiveIfNeeded();

      // Called once per past month (2 months behind current)
      expect(mockShipmentModel.find).toHaveBeenCalledTimes(2);
    });
  });
});
