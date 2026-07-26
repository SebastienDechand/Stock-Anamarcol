import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response } from 'express';

const mockVehicleService = vi.hoisted(() => ({
  listVehicles: vi.fn(),
  findVehicleById: vi.fn(),
  findVehicleDocument: vi.fn(),
  findVehicleByLicensePlate: vi.fn(),
  findOtherVehicleByLicensePlate: vi.fn(),
  findAssignedUser: vi.fn(),
  createVehicle: vi.fn(),
  deleteVehicleById: vi.fn(),
  searchVehicles: vi.fn(),
  pullVehicleDocument: vi.fn(),
}));

vi.mock('../../services/vehicle/vehicle.service', () => mockVehicleService);

vi.mock('../../utils/audit/audit.utils', () => ({
  logEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/validate/validate.utils', () => ({
  validateObjectId: vi.fn((id: string, res: Response) => {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      res.status(400).json({ message: 'Invalid ID', code: 'INVALID_ID' });
      return false;
    }
    return true;
  }),
}));

import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  searchVehicles,
  uploadDocument,
  deleteDocument,
} from './vehicle.controller';
import { logEvent } from '../../utils/audit/audit.utils';

const VALID_ID = '507f1f77bcf86cd799439011';
const DOC_ID = '507f1f77bcf86cd799439022';

const validVehicleBody = {
  brand: 'mercedes',
  model: 'citan',
  format: 'van',
  licensePlate: 'ab-123-cd',
};

describe('Vehicle Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = { params: {}, body: {}, query: {} };
    res = {
      locals: { user: { username: 'admin' } },
      status: vi.fn().mockReturnThis() as unknown as Response['status'],
      json: vi.fn() as unknown as Response['json'],
    };
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  // #region getAllVehicles
  describe('getAllVehicles', () => {
    it('should return all vehicles with 200', async () => {
      const vehicles = [{ _id: VALID_ID, licensePlate: 'AB-123-CD' }];
      mockVehicleService.listVehicles.mockResolvedValue(vehicles);

      await getAllVehicles(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(vehicles);
    });

    it('should return 500 on error', async () => {
      mockVehicleService.listVehicles.mockRejectedValue(new Error('DB error'));

      await getAllVehicles(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching vehicles',
        code: 'VEHICLE_FETCH_ERROR',
      });
    });
  });
  // #endregion

  // #region getVehicleById
  describe('getVehicleById', () => {
    it('should return 400 when ID is invalid', async () => {
      req.params = { id: 'bad-id' };
      await getVehicleById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when vehicle not found', async () => {
      req.params = { id: VALID_ID };
      mockVehicleService.findVehicleById.mockResolvedValue(null);

      await getVehicleById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Vehicle not found',
        code: 'VEHICLE_NOT_FOUND',
      });
    });

    it('should return the vehicle with 200', async () => {
      req.params = { id: VALID_ID };
      const vehicle = { _id: VALID_ID, licensePlate: 'AB-123-CD' };
      mockVehicleService.findVehicleById.mockResolvedValue(vehicle);

      await getVehicleById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(vehicle);
    });

    it('should return 500 on error', async () => {
      req.params = { id: VALID_ID };
      mockVehicleService.findVehicleById.mockRejectedValue(new Error('DB error'));

      await getVehicleById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion

  // #region createVehicle
  describe('createVehicle', () => {
    it('should return 400 when required fields are missing', async () => {
      req.body = { brand: 'mercedes' };

      await createVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing required fields: brand, model, format, licensePlate',
        code: 'VEHICLE_MISSING_FIELDS',
      });
    });

    it('should return 400 when licensePlate already exists', async () => {
      req.body = { ...validVehicleBody };
      mockVehicleService.findVehicleByLicensePlate.mockResolvedValue({ _id: 'other' });

      await createVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Vehicle with this licensePlate already exists',
        code: 'VEHICLE_LICENSE_PLATE_DUPLICATE',
      });
      expect(mockVehicleService.createVehicle).not.toHaveBeenCalled();
    });

    it('should return 400 for an invalid mercedes model', async () => {
      req.body = { ...validVehicleBody, model: 'navara' };
      mockVehicleService.findVehicleByLicensePlate.mockResolvedValue(null);

      await createVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Mercedes vehicles must be Citan or Vito',
        code: 'VEHICLE_INVALID_MERCEDES_MODEL',
      });
    });

    it('should return 400 for an invalid nissan model', async () => {
      req.body = { ...validVehicleBody, brand: 'nissan', model: 'citan' };
      mockVehicleService.findVehicleByLicensePlate.mockResolvedValue(null);

      await createVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Nissan vehicles must be Navara',
        code: 'VEHICLE_INVALID_NISSAN_MODEL',
      });
    });

    it('should return 404 when the assigned user is not found', async () => {
      req.body = { ...validVehicleBody, assignedTo: 'user1' };
      mockVehicleService.findVehicleByLicensePlate.mockResolvedValue(null);
      mockVehicleService.findAssignedUser.mockResolvedValue(null);

      await createVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Assigned user not found',
        code: 'VEHICLE_ASSIGNED_USER_NOT_FOUND',
      });
    });

    it('should create the vehicle, uppercase the plate, and log the event', async () => {
      req.body = { ...validVehicleBody };
      mockVehicleService.findVehicleByLicensePlate.mockResolvedValue(null);
      mockVehicleService.createVehicle.mockResolvedValue({
        _id: { toString: () => VALID_ID },
        licensePlate: 'AB-123-CD',
      });

      await createVehicle(req as Request, res as Response);

      expect(mockVehicleService.createVehicle).toHaveBeenCalledWith(
        expect.objectContaining({ licensePlate: 'AB-123-CD', createdBy: 'admin' }),
      );
      expect(logEvent).toHaveBeenCalledWith(
        'create',
        'vehicle',
        VALID_ID,
        'admin',
        expect.objectContaining({ licensePlate: 'ab-123-cd' }),
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 500 on unexpected error', async () => {
      req.body = { ...validVehicleBody };
      mockVehicleService.findVehicleByLicensePlate.mockRejectedValue(new Error('DB crash'));

      await createVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion

  // #region updateVehicle
  describe('updateVehicle', () => {
    it('should return 400 when ID is invalid', async () => {
      req.params = { id: 'bad-id' };
      await updateVehicle(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when vehicle not found', async () => {
      req.params = { id: VALID_ID };
      mockVehicleService.findVehicleDocument.mockResolvedValue(null);

      await updateVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when the new licensePlate is already used by another vehicle', async () => {
      req.params = { id: VALID_ID };
      req.body = { licensePlate: 'ZZ-999-ZZ' };
      mockVehicleService.findVehicleDocument.mockResolvedValue({
        licensePlate: 'AB-123-CD',
      });
      mockVehicleService.findOtherVehicleByLicensePlate.mockResolvedValue({ _id: 'other' });

      await updateVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Vehicle with this licensePlate already exists',
        code: 'VEHICLE_LICENSE_PLATE_DUPLICATE',
      });
    });

    it('should return 404 when the newly assigned user is not found', async () => {
      req.params = { id: VALID_ID };
      req.body = { assignedTo: 'user1' };
      mockVehicleService.findVehicleDocument.mockResolvedValue({
        licensePlate: 'AB-123-CD',
      });
      mockVehicleService.findAssignedUser.mockResolvedValue(null);

      await updateVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Assigned user not found',
        code: 'VEHICLE_ASSIGNED_USER_NOT_FOUND',
      });
    });

    it('should clear assignment when assignedTo is empty string', async () => {
      req.params = { id: VALID_ID };
      req.body = { assignedTo: '' };
      const vehicle = {
        licensePlate: 'AB-123-CD',
        assignedTo: 'someone',
        assignedToName: 'Someone',
        save: vi.fn().mockResolvedValue(undefined),
        populate: vi.fn().mockResolvedValue({ licensePlate: 'AB-123-CD' }),
      };
      mockVehicleService.findVehicleDocument.mockResolvedValue(vehicle);

      await updateVehicle(req as Request, res as Response);

      expect(vehicle.assignedTo).toBeUndefined();
      expect(vehicle.assignedToName).toBeUndefined();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should update fields, save, log the event and return the populated vehicle', async () => {
      req.params = { id: VALID_ID };
      req.body = { notes: 'Updated notes' };
      const populated = { licensePlate: 'AB-123-CD', notes: 'Updated notes' };
      const vehicle = {
        licensePlate: 'AB-123-CD',
        notes: undefined as string | undefined,
        save: vi.fn().mockResolvedValue(undefined),
        populate: vi.fn().mockResolvedValue(populated),
      };
      mockVehicleService.findVehicleDocument.mockResolvedValue(vehicle);

      await updateVehicle(req as Request, res as Response);

      expect(vehicle.notes).toBe('Updated notes');
      expect(vehicle.save).toHaveBeenCalled();
      expect(logEvent).toHaveBeenCalledWith(
        'update',
        'vehicle',
        VALID_ID,
        'admin',
        expect.objectContaining({ updatedFields: expect.anything() }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(populated);
    });

    it('should return 500 on unexpected error', async () => {
      req.params = { id: VALID_ID };
      mockVehicleService.findVehicleDocument.mockRejectedValue(new Error('DB crash'));

      await updateVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion

  // #region deleteVehicle
  describe('deleteVehicle', () => {
    it('should return 400 when ID is invalid', async () => {
      req.params = { id: 'bad-id' };
      await deleteVehicle(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when vehicle not found', async () => {
      req.params = { id: VALID_ID };
      mockVehicleService.deleteVehicleById.mockResolvedValue(null);

      await deleteVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete the vehicle, log the event and return 200', async () => {
      req.params = { id: VALID_ID };
      mockVehicleService.deleteVehicleById.mockResolvedValue({ licensePlate: 'AB-123-CD' });

      await deleteVehicle(req as Request, res as Response);

      expect(logEvent).toHaveBeenCalledWith(
        'delete',
        'vehicle',
        VALID_ID,
        'admin',
        expect.objectContaining({ licensePlate: 'AB-123-CD' }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on unexpected error', async () => {
      req.params = { id: VALID_ID };
      mockVehicleService.deleteVehicleById.mockRejectedValue(new Error('DB crash'));

      await deleteVehicle(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion

  // #region searchVehicles
  describe('searchVehicles', () => {
    it('should build a filter from query params and return 200', async () => {
      req.query = { q: 'AB-123', brand: 'mercedes' };
      mockVehicleService.searchVehicles.mockResolvedValue([]);

      await searchVehicles(req as Request, res as Response);

      expect(mockVehicleService.searchVehicles).toHaveBeenCalledWith(
        expect.objectContaining({ brand: 'mercedes' }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      mockVehicleService.searchVehicles.mockRejectedValue(new Error('DB crash'));

      await searchVehicles(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion

  // #region uploadDocument
  describe('uploadDocument', () => {
    it('should return 400 when ID is invalid', async () => {
      req.params = { id: 'bad-id' };
      await uploadDocument(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when file or docType is missing', async () => {
      req.params = { id: VALID_ID };
      req.body = {};
      req.file = undefined;

      await uploadDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'File and docType are required',
        code: 'VEHICLE_DOC_MISSING_FIELDS',
      });
    });

    it('should return 404 when vehicle not found', async () => {
      req.params = { id: VALID_ID };
      req.body = { docType: 'service_invoice' };
      req.file = { originalname: 'f.pdf', filename: '123-f.pdf' } as Express.Multer.File;
      mockVehicleService.findVehicleDocument.mockResolvedValue(null);

      await uploadDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should push the document, save, log the event and return 200', async () => {
      req.params = { id: VALID_ID };
      req.body = { docType: 'service_invoice', docName: 'Facture' };
      req.file = { originalname: 'f.pdf', filename: '123-f.pdf' } as Express.Multer.File;
      const vehicle = {
        documents: [] as unknown[],
        save: vi.fn().mockResolvedValue(undefined),
      };
      mockVehicleService.findVehicleDocument.mockResolvedValue(vehicle);

      await uploadDocument(req as Request, res as Response);

      expect(vehicle.documents).toHaveLength(1);
      expect(vehicle.documents[0]).toEqual(
        expect.objectContaining({ name: 'Facture', type: 'service_invoice' }),
      );
      expect(vehicle.save).toHaveBeenCalled();
      expect(logEvent).toHaveBeenCalledWith(
        'upload_document',
        'vehicle',
        VALID_ID,
        'admin',
        expect.objectContaining({ docType: 'service_invoice' }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on unexpected error', async () => {
      req.params = { id: VALID_ID };
      req.body = { docType: 'service_invoice' };
      req.file = { originalname: 'f.pdf', filename: 'f.pdf' } as Express.Multer.File;
      mockVehicleService.findVehicleDocument.mockRejectedValue(new Error('DB crash'));

      await uploadDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion

  // #region deleteDocument
  describe('deleteDocument', () => {
    it('should return 400 when vehicle ID is invalid', async () => {
      req.params = { id: 'bad-id', docId: DOC_ID };
      await deleteDocument(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when doc ID is invalid', async () => {
      req.params = { id: VALID_ID, docId: 'bad-id' };
      await deleteDocument(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when vehicle not found', async () => {
      req.params = { id: VALID_ID, docId: DOC_ID };
      mockVehicleService.pullVehicleDocument.mockResolvedValue(null);

      await deleteDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should pull the document, log the event and return 200', async () => {
      req.params = { id: VALID_ID, docId: DOC_ID };
      const updatedVehicle = { licensePlate: 'AB-123-CD', documents: [] };
      mockVehicleService.pullVehicleDocument.mockResolvedValue(updatedVehicle);

      await deleteDocument(req as Request, res as Response);

      expect(mockVehicleService.pullVehicleDocument).toHaveBeenCalledWith(VALID_ID, DOC_ID);
      expect(logEvent).toHaveBeenCalledWith(
        'delete_document',
        'vehicle',
        VALID_ID,
        'admin',
        expect.objectContaining({ docId: DOC_ID }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedVehicle);
    });

    it('should return 500 on unexpected error', async () => {
      req.params = { id: VALID_ID, docId: DOC_ID };
      mockVehicleService.pullVehicleDocument.mockRejectedValue(new Error('DB crash'));

      await deleteDocument(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
  // #endregion
});
