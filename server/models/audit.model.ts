import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAudit extends Document {
  entity: string; // e.g., 'user', 'contact', 'item'
  entityId?: mongoose.Types.ObjectId | string;
  action: string; // create, update, delete, login, logout, upload, move, etc.
  userName?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AuditSchema = new Schema<IAudit>(
  {
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    action: { type: String, required: true },
    userName: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

AuditSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
// Purge auto après 90 jours
AuditSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

const AuditModel: Model<IAudit> = mongoose.model<IAudit>("audit", AuditSchema);

export default AuditModel;
