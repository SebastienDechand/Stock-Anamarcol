import type { IShipmentArchive } from "../models/shipmentArchive.model";

/** Archive object returned after creation (without fileBuffer). */
export interface ArchiveResult {
  _id: IShipmentArchive["_id"];
  title: string;
  periodStart: Date;
  periodEnd: Date;
  shipmentCount: number;
  fileBuffer: Buffer;
  createdAt: Date;
}
