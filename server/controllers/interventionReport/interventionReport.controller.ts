import { Request, Response } from "express";
import * as interventionReportService from "../../services/interventionReport/interventionReport.service";
import { validateObjectId } from "../../utils/validate/validate.utils";
import { handleError } from "../../utils/response/response.utils";
import { ErrorCode } from "../../constants/errorCodes";

// #region List all reports (optionally filter by clientFile)
export const getInterventionReports = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const filter = req.query.clientFileId
      ? { clientFile: req.query.clientFileId }
      : {};
    const reports = await interventionReportService.listInterventionReports(filter);
    res.status(200).json(reports);
  } catch (err) {
    handleError(res, err, "Error fetching intervention reports:");
  }
};
// #endregion

// #region Get one report
export const getInterventionReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const report = await interventionReportService.findInterventionReportById(
      req.params.id as string,
    );
    if (!report) {
      res
        .status(404)
        .json({ message: "Report not found", code: ErrorCode.REPORT_NOT_FOUND });
      return;
    }
    res.status(200).json(report);
  } catch (err) {
    handleError(res, err, "Error fetching intervention report:");
  }
};
// #endregion

// #region Create report
export const createInterventionReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data = { ...req.body, createdBy: res.locals.user?.username };
    const report = await interventionReportService.createInterventionReport(data);
    res.status(201).json({ interventionReport: report._id });
  } catch (err) {
    console.error("Error creating intervention report:", err);
    res.status(400).json({
      message: "Error creating report",
      code: ErrorCode.REPORT_CREATE_ERROR,
    });
  }
};
// #endregion

// #region Update report
export const updateInterventionReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const report = await interventionReportService.findInterventionReportDocument(
      req.params.id as string,
    );
    if (!report) {
      res
        .status(404)
        .json({ message: "Report not found", code: ErrorCode.REPORT_NOT_FOUND });
      return;
    }

    const fields = [
      "twRegister1",
      "twRegister2",
      "twRegister3",
      "twRegisters",
      "twPc",
      "cashguardUnits",
      "notes",
    ] as const;

    const mutableReport = report as unknown as Record<string, unknown>;
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        mutableReport[field] = req.body[field];
      }
    }
    report.updatedBy = res.locals.user?.username;

    const updated = await report.save();
    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating intervention report:", err);
    res.status(400).json({
      message: "Error updating report",
      code: ErrorCode.REPORT_UPDATE_ERROR,
    });
  }
};
// #endregion

// #region Delete report
export const deleteInterventionReport = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const report = await interventionReportService.deleteInterventionReportById(
      req.params.id as string,
    );
    if (!report) {
      res
        .status(404)
        .json({ message: "Report not found", code: ErrorCode.REPORT_NOT_FOUND });
      return;
    }
    res
      .status(200)
      .json({ message: "Report deleted", code: ErrorCode.REPORT_DELETED });
  } catch (err) {
    handleError(res, err, "Error deleting intervention report:");
  }
};
// #endregion
