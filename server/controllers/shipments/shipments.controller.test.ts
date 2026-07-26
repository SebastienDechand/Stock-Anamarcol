import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { Request, Response } from 'express';

const mockShipmentsService = vi.hoisted(() => ({
  listShipments: vi.fn(),
  createShipment: vi.fn(),
  findShipmentDocument: vi.fn(),
  deleteShipmentById: vi.fn(),
  listArchives: vi.fn(),
  findArchiveById: vi.fn(),
  performArchiveForMonth: vi.fn(),
  autoArchiveIfNeeded: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/shipments/shipments.service', () => mockShipmentsService);

const mockXLSX = vi.hoisted(() => ({
  utils: {
    json_to_sheet: vi.fn().mockReturnValue({}),
    book_new: vi.fn().mockReturnValue({}),
    book_append_sheet: vi.fn(),
  },
  write: vi.fn().mockReturnValue(Buffer.from('fake-xlsx')),
}));

vi.mock('xlsx', () => mockXLSX);

import {
  getShipments,
  createShipment,
  markSent,
  deleteShipment,
  createArchive,
  getArchives,
  downloadArchive,
} from './shipments.controller';

describe('Shipments Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      locals: { user: { username: 'hotliner', _id: '1' } },
      status: vi.fn().mockReturnThis() as unknown as Response['status'],
      json: vi.fn() as unknown as Response['json'],
      setHeader: vi.fn() as unknown as Response['setHeader'],
      send: vi.fn() as unknown as Response['send'],
      end: vi.fn() as unknown as Response['end'],
    };
    vi.clearAllMocks();
    mockShipmentsService.autoArchiveIfNeeded.mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  const validBody = {
    lastName: 'DUPONT',
    firstName: 'JEAN',
    address: '7 AVENUE MOZART',
    postalCode: '75016',
    city: 'PARIS',
    companyOrRole: 'BOULANGERIE',
    company: 'DUPONT SARL',
    part: 'Hooper',
  };

  describe('getShipments', () => {
    it('should return all shipments', async () => {
      const mockList = [{ _id: 's1', lastName: 'DUPONT' }];
      mockShipmentsService.listShipments.mockResolvedValue(mockList);
      await getShipments(req as Request, res as Response);
      expect(mockShipmentsService.autoArchiveIfNeeded).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockList);
    });

    it('should filter by clientFileId when provided', async () => {
      req.query = { clientFileId: 'cf1' };
      mockShipmentsService.listShipments.mockResolvedValue([]);
      await getShipments(req as Request, res as Response);
      expect(mockShipmentsService.listShipments).toHaveBeenCalledWith({ clientFile: 'cf1' });
    });

    it('should return 500 on error', async () => {
      mockShipmentsService.autoArchiveIfNeeded.mockRejectedValue(new Error('fail'));
      await getShipments(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createShipment', () => {
    it('should return 400 when required fields are missing', async () => {
      req.body = { lastName: 'DUPONT' };
      await createShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create and return shipment', async () => {
      req.body = { ...validBody };
      mockShipmentsService.createShipment.mockResolvedValue({
        _id: 's2',
        ...validBody,
      });
      await createShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should accept requestDate if provided', async () => {
      const dt = '2026-02-01T10:00:00.000Z';
      req.body = { ...validBody, requestDate: dt };
      mockShipmentsService.createShipment.mockResolvedValue({
        _id: 'sB',
        ...validBody,
        requestDate: new Date(dt),
      });
      await createShipment(req as Request, res as Response);
      expect(mockShipmentsService.createShipment).toHaveBeenCalledWith(
        expect.objectContaining({
          lastName: 'DUPONT',
          requestDate: new Date(dt),
        }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 500 on create error', async () => {
      req.body = { ...validBody };
      mockShipmentsService.createShipment.mockRejectedValue(new Error('DB error'));
      await createShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should report all missing required fields', async () => {
      req.body = {};
      await createShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
      const payload = (res.json as Mock).mock.calls[0][0];
      expect(payload.message).toContain('lastName');
      expect(payload.message).toContain('firstName');
      expect(payload.message).toContain('part');
    });
  });

  describe('markSent', () => {
    it('should return 400 for invalid ObjectId', async () => {
      req.params = { id: 'bad' };
      await markSent(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439011' };
      mockShipmentsService.findShipmentDocument.mockResolvedValue(null);
      await markSent(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should mark as sent', async () => {
      req.params = { id: '507f1f77bcf86cd799439012' };
      const mockShipment: Record<string, unknown> = {
        sent: false,
        save: vi.fn().mockResolvedValue({ sent: true }),
      };
      mockShipmentsService.findShipmentDocument.mockResolvedValue(mockShipment);
      await markSent(req as Request, res as Response);
      expect(mockShipment.sent).toBe(true);
      expect(mockShipment.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should set sentAt and sentBy when marking sent', async () => {
      req.params = { id: '507f1f77bcf86cd799439016' };
      const mockShipment: Record<string, unknown> = {
        sent: false,
        sentAt: undefined,
        sentBy: undefined,
        save: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
          return Promise.resolve(this);
        }),
      };
      mockShipmentsService.findShipmentDocument.mockResolvedValue(mockShipment);
      await markSent(req as Request, res as Response);
      expect(mockShipment.sent).toBe(true);
      expect(mockShipment.sentAt).toBeInstanceOf(Date);
      expect(mockShipment.sentBy).toBe('hotliner');
    });

    it('should return 500 on save error', async () => {
      req.params = { id: '507f1f77bcf86cd799439017' };
      const mockShipment = {
        sent: false,
        save: vi.fn().mockRejectedValue(new Error('save fail')),
      };
      mockShipmentsService.findShipmentDocument.mockResolvedValue(mockShipment);
      await markSent(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteShipment', () => {
    it('should return 400 for invalid ObjectId', async () => {
      req.params = { id: 'bad' };
      await deleteShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should delete and respond 200', async () => {
      req.params = { id: '507f1f77bcf86cd799439013' };
      mockShipmentsService.deleteShipmentById.mockResolvedValue({ deletedCount: 1 });
      await deleteShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on delete error', async () => {
      req.params = { id: '507f1f77bcf86cd799439018' };
      mockShipmentsService.deleteShipmentById.mockRejectedValue(new Error('delete fail'));
      await deleteShipment(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createArchive', () => {
    it('should return 400 when no shipments exist for current month', async () => {
      mockShipmentsService.performArchiveForMonth.mockResolvedValue(null);
      await createArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should archive current month shipments and return metadata', async () => {
      const now = new Date();
      mockShipmentsService.performArchiveForMonth.mockResolvedValue({
        _id: 'arc1',
        title: 'Janvier 2026',
        periodStart: now,
        periodEnd: now,
        shipmentCount: 1,
        createdAt: now,
      });

      await createArchive(req as Request, res as Response);
      expect(mockShipmentsService.performArchiveForMonth).toHaveBeenCalledWith(
        now.getFullYear(),
        now.getMonth(),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 500 on error', async () => {
      mockShipmentsService.performArchiveForMonth.mockRejectedValue(new Error('fail'));
      await createArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getArchives', () => {
    it('should return archives without fileBuffer', async () => {
      const archives = [{ _id: 'arc1', title: 'Janvier 2026' }];
      mockShipmentsService.listArchives.mockResolvedValue(archives);
      await getArchives(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(archives);
    });

    it('should return 500 on error', async () => {
      mockShipmentsService.listArchives.mockRejectedValue(new Error('fail'));
      await getArchives(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('downloadArchive', () => {
    it('should return 400 for invalid ObjectId', async () => {
      req.params = { id: 'bad' };
      await downloadArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when archive not found', async () => {
      req.params = { id: '507f1f77bcf86cd799439014' };
      mockShipmentsService.findArchiveById.mockResolvedValue(null);
      await downloadArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should send PDF buffer', async () => {
      req.params = { id: '507f1f77bcf86cd799439015' };
      const buf = Buffer.from('pdf-data');
      mockShipmentsService.findArchiveById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439015',
        title: 'Janvier 2026',
        fileBuffer: buf,
      });
      await downloadArchive(req as Request, res as Response);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.end).toHaveBeenCalledWith(buf);
    });

    it('should send XLSX buffer when format=xlsx', async () => {
      req.params = { id: '507f1f77bcf86cd799439015' };
      req.query = { format: 'xlsx' };
      const rawData = [{ Nom: 'DUPONT', Prénom: 'JEAN' }];
      mockShipmentsService.findArchiveById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439015',
        title: 'Janvier 2026',
        rawData,
        fileBuffer: Buffer.from('pdf'),
      });
      await downloadArchive(req as Request, res as Response);
      expect(mockXLSX.utils.json_to_sheet).toHaveBeenCalledWith(rawData);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.end).toHaveBeenCalled();
    });

    it('should return 400 when xlsx requested but no rawData', async () => {
      req.params = { id: '507f1f77bcf86cd799439015' };
      req.query = { format: 'xlsx' };
      mockShipmentsService.findArchiveById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439015',
        title: 'Janvier 2026',
        rawData: [],
        fileBuffer: Buffer.from('pdf'),
      });
      await downloadArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on error', async () => {
      req.params = { id: '507f1f77bcf86cd799439015' };
      mockShipmentsService.findArchiveById.mockRejectedValue(new Error('DB error'));
      await downloadArchive(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
