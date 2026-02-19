import { Request, Response } from "express";

const mockReportModel = {
  find: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

jest.mock("../models/interventionReport.model", () => ({
  __esModule: true,
  default: mockReportModel,
}));

jest.mock("../utils/validate.utils", () => ({
  validateObjectId: jest.fn((id: string, res: Response) => {
    const valid = /^[a-f\d]{24}$/i.test(id);
    if (!valid) {
      (res.status as jest.Mock)(400).json({ error: "Invalid ObjectId" });
    }
    return valid;
  }),
}));

import {
  getInterventionReports,
  getInterventionReport,
  createInterventionReport,
  updateInterventionReport,
  deleteInterventionReport,
} from "../controllers/interventionReport.controller";

const VALID_ID = "507f1f77bcf86cd799439011";
const CLIENT_FILE_ID = "507f1f77bcf86cd799439012";

const mockUnit = {
  nSerie: "SN001",
  up: "UP1",
  ub: "UB1",
  k7Slots: ["", "", "", ""],
  assignedCaisses: ["CAISSE 1"],
  hasPc: false,
};

const mockReport = {
  _id: VALID_ID,
  clientFile: CLIENT_FILE_ID,
  twCaisses: ["TW123"],
  twPc: "TWPC456",
  cashguardUnits: [mockUnit],
  notes: "Test notes",
  createdBy: "monteur1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  save: jest.fn(),
};

describe("InterventionReport Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      locals: { user: { pseudo: "monteur1" } },
      status: jest.fn().mockReturnThis() as unknown as Response["status"],
      json: jest.fn() as unknown as Response["json"],
    };
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── getInterventionReports ────────────────────────────
  describe("getInterventionReports", () => {
    it("should return all reports with 200", async () => {
      const reports = [mockReport];
      mockReportModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(reports),
          }),
        }),
      });

      await getInterventionReports(req as Request, res as Response);

      expect(mockReportModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(reports);
    });

    it("should filter by clientFileId when provided", async () => {
      req.query = { clientFileId: CLIENT_FILE_ID };
      mockReportModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([mockReport]),
          }),
        }),
      });

      await getInterventionReports(req as Request, res as Response);

      expect(mockReportModel.find).toHaveBeenCalledWith({
        clientFile: CLIENT_FILE_ID,
      });
    });

    it("should return 500 on error", async () => {
      mockReportModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockRejectedValue(new Error("DB error")),
          }),
        }),
      });

      await getInterventionReports(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ─── getInterventionReport ─────────────────────────────
  describe("getInterventionReport", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      await getInterventionReport(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when report not found", async () => {
      req.params = { id: VALID_ID };
      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      await getInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "Rapport introuvable",
      });
    });

    it("should return the report with 200", async () => {
      req.params = { id: VALID_ID };
      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockReport),
        }),
      });

      await getInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockReport);
    });
  });

  // ─── createInterventionReport ──────────────────────────
  describe("createInterventionReport", () => {
    it("should create a report and return 201", async () => {
      req.body = {
        clientFile: CLIENT_FILE_ID,
        twCaisses: ["TW123"],
        cashguardUnits: [mockUnit],
      };
      mockReportModel.create.mockResolvedValue({
        ...mockReport,
        _id: { toString: () => VALID_ID },
      });

      await createInterventionReport(req as Request, res as Response);

      expect(mockReportModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          clientFile: CLIENT_FILE_ID,
          createdBy: "monteur1",
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        interventionReport: expect.anything(),
      });
    });

    it("should return 400 on validation error", async () => {
      req.body = {};
      mockReportModel.create.mockRejectedValue(new Error("validation failed"));

      await createInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ─── updateInterventionReport ──────────────────────────
  describe("updateInterventionReport", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      await updateInterventionReport(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when report not found", async () => {
      req.params = { id: VALID_ID };
      mockReportModel.findById.mockResolvedValue(null);

      await updateInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update fields and return 200", async () => {
      req.params = { id: VALID_ID };
      req.body = { notes: "Updated notes", twCaisses: ["TW999"] };

      const report = {
        ...mockReport,
        save: jest.fn().mockResolvedValue({
          ...mockReport,
          notes: "Updated notes",
        }),
      };
      mockReportModel.findById.mockResolvedValue(report);

      await updateInterventionReport(req as Request, res as Response);

      expect(report.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should set updatedBy from locals", async () => {
      req.params = { id: VALID_ID };
      req.body = { notes: "new note" };

      const report = {
        ...mockReport,
        updatedBy: undefined as string | undefined,
        save: jest.fn().mockResolvedValue(mockReport),
      };
      mockReportModel.findById.mockResolvedValue(report);

      await updateInterventionReport(req as Request, res as Response);

      expect(report.updatedBy).toBe("monteur1");
    });
  });

  // ─── deleteInterventionReport ──────────────────────────
  describe("deleteInterventionReport", () => {
    it("should return 400 when ID is invalid", async () => {
      req.params = { id: "invalid" };
      await deleteInterventionReport(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 404 when report not found", async () => {
      req.params = { id: VALID_ID };
      mockReportModel.findByIdAndDelete.mockResolvedValue(null);

      await deleteInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete report and return 200", async () => {
      req.params = { id: VALID_ID };
      mockReportModel.findByIdAndDelete.mockResolvedValue(mockReport);

      await deleteInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Rapport supprimé" });
    });
  });
});
