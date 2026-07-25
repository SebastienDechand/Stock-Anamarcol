import { describe, it, expect, vi } from "vitest";

const mockReportModel = vi.hoisted(() => ({
  find: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  findByIdAndDelete: vi.fn(),
}));

vi.mock("../models/interventionReport.model", () => ({
  __esModule: true,
  default: mockReportModel,
}));

import {
  listInterventionReports,
  findInterventionReportById,
  findInterventionReportDocument,
  createInterventionReport,
  deleteInterventionReportById,
} from "../services/interventionReport.service";

const CLIENT_FILE_ID = "507f1f77bcf86cd799439012";

describe("interventionReport.service", () => {
  it("listInterventionReports sorts, populates and leans", async () => {
    const reports = [{ _id: "r1" }];
    const lean = vi.fn().mockResolvedValue(reports);
    const populate = vi.fn().mockReturnValue({ lean });
    const sort = vi.fn().mockReturnValue({ populate });
    mockReportModel.find.mockReturnValue({ sort });

    const result = await listInterventionReports({ clientFile: CLIENT_FILE_ID });

    expect(mockReportModel.find).toHaveBeenCalledWith({ clientFile: CLIENT_FILE_ID });
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(populate).toHaveBeenCalledWith(
      "clientFile",
      "lastName firstName company postalCode city",
    );
    expect(result).toBe(reports);
  });

  it("findInterventionReportById populates and leans", async () => {
    const report = { _id: "r1" };
    const lean = vi.fn().mockResolvedValue(report);
    const populate = vi.fn().mockReturnValue({ lean });
    mockReportModel.findById.mockReturnValue({ populate });

    const result = await findInterventionReportById("r1");

    expect(mockReportModel.findById).toHaveBeenCalledWith("r1");
    expect(result).toBe(report);
  });

  it("findInterventionReportDocument returns the raw findById query", () => {
    const doc = { _id: "r1" };
    mockReportModel.findById.mockReturnValue(doc);
    expect(findInterventionReportDocument("r1")).toBe(doc);
  });

  it("createInterventionReport delegates to the model", async () => {
    const data = { clientFile: CLIENT_FILE_ID };
    mockReportModel.create.mockResolvedValue({ _id: "r1", ...data });
    const result = await createInterventionReport(data);
    expect(mockReportModel.create).toHaveBeenCalledWith(data);
    expect(result).toEqual({ _id: "r1", ...data });
  });

  it("deleteInterventionReportById delegates to findByIdAndDelete", async () => {
    mockReportModel.findByIdAndDelete.mockResolvedValue({ _id: "r1" });
    const result = await deleteInterventionReportById("r1");
    expect(mockReportModel.findByIdAndDelete).toHaveBeenCalledWith("r1");
    expect(result).toEqual({ _id: "r1" });
  });
});
