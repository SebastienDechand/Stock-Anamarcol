import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IShipmentArchive extends Document {
  /** Human-readable title, e.g. "February 2026" */
  title: string;
  /** Start of the archived period */
  periodStart: Date;
  /** End of the archived period */
  periodEnd: Date;
  /** Number of shipments in this archive */
  shipmentCount: number;
  /** PDF binary data */
  fileBuffer: Buffer;
  /** Raw shipment data for XLSX generation */
  rawData?: Record<string, string>[];
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentArchiveSchema = new Schema<IShipmentArchive>(
  {
    title: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    shipmentCount: { type: Number, required: true },
    fileBuffer: { type: Buffer, required: true },
    rawData: { type: [Schema.Types.Mixed], default: undefined },
  },
  { timestamps: true },
);

ShipmentArchiveSchema.index({ createdAt: -1 });

const ShipmentArchiveModel: Model<IShipmentArchive> = mongoose.model<IShipmentArchive>(
  'shipmentArchive',
  ShipmentArchiveSchema,
);

export default ShipmentArchiveModel;
