import ClientFileModel, { IClientFile } from "../models/clientFile.model";
import type { HydratedDocument } from "mongoose";

export function listClientFiles() {
  return ClientFileModel.find()
    .sort({ createdAt: -1 })
    .populate("contactRef", "name email phone")
    .lean();
}

export function findClientFileById(id: string) {
  return ClientFileModel.findById(id)
    .populate("contactRef", "name email phone")
    .lean();
}

export function findClientFileDocument(
  id: string,
): Promise<HydratedDocument<IClientFile> | null> {
  return ClientFileModel.findById(id);
}

export function findClientFileBySiretAndAddress(siret: string, address: string) {
  return ClientFileModel.findOne({
    siret,
    address: { $regex: `^${address}$`, $options: "i" },
  }).lean();
}

export function findClientFileByNameAndAddress(lastName: string, address: string) {
  return ClientFileModel.findOne({
    lastName: { $regex: `^${lastName}$`, $options: "i" },
    address: { $regex: `^${address}$`, $options: "i" },
  }).lean();
}

export function createClientFile(data: Partial<IClientFile>) {
  return ClientFileModel.create(data);
}

export function deleteClientFileById(id: string) {
  return ClientFileModel.findByIdAndDelete(id);
}
