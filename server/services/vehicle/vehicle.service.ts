import { Types } from 'mongoose';
import VehicleModel, { IVehicle } from '../../models/vehicle.model';
import UserModel from '../../models/user.model';

const ASSIGNED_TO_FIELDS = 'username email position';

export function listVehicles() {
  return VehicleModel.find().populate('assignedTo', ASSIGNED_TO_FIELDS).sort({ createdAt: -1 });
}

export function findVehicleById(id: string) {
  return VehicleModel.findById(id).populate('assignedTo', ASSIGNED_TO_FIELDS);
}

export function findVehicleDocument(id: string) {
  return VehicleModel.findById(id);
}

export function findVehicleByLicensePlate(licensePlate: string) {
  return VehicleModel.findOne({ licensePlate: licensePlate.toUpperCase() });
}

export function findOtherVehicleByLicensePlate(licensePlate: string, excludeId: string) {
  return VehicleModel.findOne({
    licensePlate: licensePlate.toUpperCase(),
    _id: { $ne: new Types.ObjectId(excludeId) },
  } as Record<string, unknown>);
}

export function findAssignedUser(userId: string) {
  return UserModel.findById(userId);
}

export async function createVehicle(data: Partial<IVehicle>) {
  const vehicle = new VehicleModel(data);
  await vehicle.save();
  return vehicle;
}

export function deleteVehicleById(id: string) {
  return VehicleModel.findByIdAndDelete(id);
}

export function searchVehicles(filter: Record<string, unknown>) {
  return VehicleModel.find(filter)
    .populate('assignedTo', ASSIGNED_TO_FIELDS)
    .sort({ createdAt: -1 });
}

export function pullVehicleDocument(id: string, docId: string) {
  return VehicleModel.findByIdAndUpdate(
    id,
    { $pull: { documents: { _id: docId } } },
    { new: true },
  ).populate('assignedTo', ASSIGNED_TO_FIELDS);
}
