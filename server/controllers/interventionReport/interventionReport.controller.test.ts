import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { Request, Response } from 'express';

const mockReportService = vi.hoisted(() => ({
  listInterventionReports: vi.fn(),
  findInterventionReportById: vi.fn(),
  findInterventionReportDocument: vi.fn(),
  createInterventionReport: vi.fn(),
  deleteInterventionReportById: vi.fn(),
}));

vi.mock('../../services/interventionReport/interventionReport.service', () => mockReportService);

vi.mock('../../utils/validate/validate.utils', () => ({
  validateObjectId: vi.fn((id: string, res: Response) => {
    const valid = /^[a-f\d]{24}$/i.test(id);
    if (!valid) {
      (res.status as Mock)(400).json({ error: 'Invalid ObjectId' });
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
} from './interventionReport.controller';

const VALID_ID = '507f1f77bcf86cd799439011';
const CLIENT_FILE_ID = '507f1f77bcf86cd799439012';

const mockUnit = {
  serialNumber: 'SN001',
  up: 'UP1',
  ub: 'UB1',
  cassetteSlots: ['', '', '', ''],
  assignedRegisters: ['CAISSE 1'],
  hasPc: false,
};

const mockReport = {
  _id: VALID_ID,
  clientFile: CLIENT_FILE_ID,
  twRegisters: ['TW123'],
  twPc: 'TWPC456',
  cashguardUnits: [mockUnit],
  notes: 'Test notes',
  createdBy: 'monteur1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  save: vi.fn(),
};

describe('InterventionReport Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      locals: { user: { username: 'monteur1' } },
      status: vi.fn().mockReturnThis() as unknown as Response['status'],
      json: vi.fn() as unknown as Response['json'],
    };
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // #region getInterventionReports
  describe('getInterventionReports', () => {
    it('should return all reports with 200', async () => {
      const reports = [mockReport];
      mockReportService.listInterventionReports.mockResolvedValue(reports);

      await getInterventionReports(req as Request, res as Response);

      expect(mockReportService.listInterventionReports).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(reports);
    });

    it('should filter by clientFileId when provided', async () => {
      req.query = { clientFileId: CLIENT_FILE_ID };
      mockReportService.listInterventionReports.mockResolvedValue([mockReport]);

      await getInterventionReports(req as Request, res as Response);

      expect(mockReportService.listInterventionReports).toHaveBeenCalledWith({
        clientFile: CLIENT_FILE_ID,
      });
    });

    it('should return 500 on error', async () => {
      mockReportService.listInterventionReports.mockRejectedValue(new Error('DB error'));

      await getInterventionReports(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion

  // #region getInterventionReport
  describe('getInterventionReport', () => {
    it('should return 400 when ID is invalid', async () => {
      req.params = { id: 'invalid' };
      await getInterventionReport(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when report not found', async () => {
      req.params = { id: VALID_ID };
      mockReportService.findInterventionReportById.mockResolvedValue(null);

      await getInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Report not found',
        code: 'REPORT_NOT_FOUND',
      });
    });

    it('should return the report with 200', async () => {
      req.params = { id: VALID_ID };
      mockReportService.findInterventionReportById.mockResolvedValue(mockReport);

      await getInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockReport);
    });
  });
  // #endregion

  // #region createInterventionReport
  describe('createInterventionReport', () => {
    it('should create a report and return 201', async () => {
      req.body = {
        clientFile: CLIENT_FILE_ID,
        twRegisters: ['TW123'],
        cashguardUnits: [mockUnit],
      };
      mockReportService.createInterventionReport.mockResolvedValue({
        ...mockReport,
        _id: { toString: () => VALID_ID },
      });

      await createInterventionReport(req as Request, res as Response);

      expect(mockReportService.createInterventionReport).toHaveBeenCalledWith(
        expect.objectContaining({
          clientFile: CLIENT_FILE_ID,
          createdBy: 'monteur1',
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        interventionReport: expect.anything(),
      });
    });

    it('should return 400 on validation error', async () => {
      req.body = {};
      mockReportService.createInterventionReport.mockRejectedValue(new Error('validation failed'));

      await createInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
  // #endregion

  // #region updateInterventionReport
  describe('updateInterventionReport', () => {
    it('should return 400 when ID is invalid', async () => {
      req.params = { id: 'invalid' };
      await updateInterventionReport(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when report not found', async () => {
      req.params = { id: VALID_ID };
      mockReportService.findInterventionReportDocument.mockResolvedValue(null);

      await updateInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update fields and return 200', async () => {
      req.params = { id: VALID_ID };
      req.body = { notes: 'Updated notes', twRegisters: ['TW999'] };

      const report = {
        ...mockReport,
        save: vi.fn().mockResolvedValue({
          ...mockReport,
          notes: 'Updated notes',
        }),
      };
      mockReportService.findInterventionReportDocument.mockResolvedValue(report);

      await updateInterventionReport(req as Request, res as Response);

      expect(report.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should set updatedBy from locals', async () => {
      req.params = { id: VALID_ID };
      req.body = { notes: 'new note' };

      const report = {
        ...mockReport,
        updatedBy: undefined as string | undefined,
        save: vi.fn().mockResolvedValue(mockReport),
      };
      mockReportService.findInterventionReportDocument.mockResolvedValue(report);

      await updateInterventionReport(req as Request, res as Response);

      expect(report.updatedBy).toBe('monteur1');
    });
  });
  // #endregion

  // #region deleteInterventionReport
  describe('deleteInterventionReport', () => {
    it('should return 400 when ID is invalid', async () => {
      req.params = { id: 'invalid' };
      await deleteInterventionReport(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when report not found', async () => {
      req.params = { id: VALID_ID };
      mockReportService.deleteInterventionReportById.mockResolvedValue(null);

      await deleteInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete report and return 200', async () => {
      req.params = { id: VALID_ID };
      mockReportService.deleteInterventionReportById.mockResolvedValue(mockReport);

      await deleteInterventionReport(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Report deleted',
        code: 'REPORT_DELETED',
      });
    });
  });
  // #endregion
});
