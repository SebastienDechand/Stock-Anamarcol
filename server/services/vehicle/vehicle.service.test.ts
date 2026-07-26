import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockVehicleModel = vi.hoisted(() => {
  function VehicleModelCtor(this: Record<string, unknown>, data: Record<string, unknown>) {
    Object.assign(this, data);
    this.save = vi.fn().mockResolvedValue(undefined);
  }
  return Object.assign(VehicleModelCtor, {
    find: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
    findByIdAndDelete: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  });
});

const mockUserModel = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock('../../models/vehicle.model', () => ({
  __esModule: true,
  default: mockVehicleModel,
}));

vi.mock('../../models/user.model', () => ({
  __esModule: true,
  default: mockUserModel,
}));

import {
  listVehicles,
  findVehicleById,
  findVehicleDocument,
  findVehicleByLicensePlate,
  findOtherVehicleByLicensePlate,
  findAssignedUser,
  createVehicle,
  deleteVehicleById,
  searchVehicles,
  pullVehicleDocument,
} from './vehicle.service';

const VALID_ID = '507f1f77bcf86cd799439011';
const ASSIGNED_FIELDS = 'username email position';

describe('vehicle.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listVehicles populates assignedTo and sorts by createdAt desc', () => {
    const sort = vi.fn().mockReturnValue([]);
    const populate = vi.fn().mockReturnValue({ sort });
    mockVehicleModel.find.mockReturnValue({ populate });

    listVehicles();

    expect(mockVehicleModel.find).toHaveBeenCalledWith();
    expect(populate).toHaveBeenCalledWith('assignedTo', ASSIGNED_FIELDS);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('findVehicleById populates assignedTo', () => {
    const populate = vi.fn().mockReturnValue({ _id: VALID_ID });
    mockVehicleModel.findById.mockReturnValue({ populate });

    findVehicleById(VALID_ID);

    expect(mockVehicleModel.findById).toHaveBeenCalledWith(VALID_ID);
    expect(populate).toHaveBeenCalledWith('assignedTo', ASSIGNED_FIELDS);
  });

  it('findVehicleDocument returns the raw findById query', () => {
    const doc = { _id: VALID_ID };
    mockVehicleModel.findById.mockReturnValue(doc);
    expect(findVehicleDocument(VALID_ID)).toBe(doc);
  });

  it('findVehicleByLicensePlate uppercases the plate', () => {
    mockVehicleModel.findOne.mockResolvedValue(null);
    findVehicleByLicensePlate('ab-123-cd');
    expect(mockVehicleModel.findOne).toHaveBeenCalledWith({ licensePlate: 'AB-123-CD' });
  });

  it('findOtherVehicleByLicensePlate excludes the given id', () => {
    mockVehicleModel.findOne.mockResolvedValue(null);
    findOtherVehicleByLicensePlate('ab-123-cd', VALID_ID);
    const callArg = mockVehicleModel.findOne.mock.calls[0][0];
    expect(callArg.licensePlate).toBe('AB-123-CD');
    expect(callArg._id.$ne.toString()).toBe(VALID_ID);
  });

  it('findAssignedUser delegates to UserModel.findById', () => {
    mockUserModel.findById.mockResolvedValue({ _id: 'u1' });
    findAssignedUser('u1');
    expect(mockUserModel.findById).toHaveBeenCalledWith('u1');
  });

  it('createVehicle constructs and saves a new document', async () => {
    const data = { brand: 'mercedes', model: 'citan' } as unknown as Parameters<
      typeof createVehicle
    >[0];
    const result = await createVehicle(data);
    expect(result).toMatchObject(data);
    expect((result as unknown as { save: ReturnType<typeof vi.fn> }).save).toHaveBeenCalled();
  });

  it('deleteVehicleById delegates to findByIdAndDelete', async () => {
    mockVehicleModel.findByIdAndDelete.mockResolvedValue({ _id: VALID_ID });
    const result = await deleteVehicleById(VALID_ID);
    expect(mockVehicleModel.findByIdAndDelete).toHaveBeenCalledWith(VALID_ID);
    expect(result).toEqual({ _id: VALID_ID });
  });

  it('searchVehicles populates and sorts with the given filter', () => {
    const sort = vi.fn().mockReturnValue([]);
    const populate = vi.fn().mockReturnValue({ sort });
    mockVehicleModel.find.mockReturnValue({ populate });

    searchVehicles({ brand: 'mercedes' });

    expect(mockVehicleModel.find).toHaveBeenCalledWith({ brand: 'mercedes' });
    expect(populate).toHaveBeenCalledWith('assignedTo', ASSIGNED_FIELDS);
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('pullVehicleDocument pulls the document by id and populates assignedTo', () => {
    const populate = vi.fn().mockReturnValue({ _id: VALID_ID });
    mockVehicleModel.findByIdAndUpdate.mockReturnValue({ populate });

    pullVehicleDocument(VALID_ID, 'doc1');

    expect(mockVehicleModel.findByIdAndUpdate).toHaveBeenCalledWith(
      VALID_ID,
      { $pull: { documents: { _id: 'doc1' } } },
      { new: true },
    );
    expect(populate).toHaveBeenCalledWith('assignedTo', ASSIGNED_FIELDS);
  });
});
