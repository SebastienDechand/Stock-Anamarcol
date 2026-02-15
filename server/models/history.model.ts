import mongoose, { Document, Model, Schema } from "mongoose";

export interface IHistory extends Document {
  itemId: mongoose.Types.ObjectId;
  action: "create" | "update" | "delete" | "quantity_change";
  field?: string;
  oldValue?: string;
  newValue?: string;
  userName: string;
  createdAt: Date;
}

const HistorySchema = new Schema<IHistory>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: "item",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "quantity_change"],
    },
    field: {
      type: String,
    },
    oldValue: {
      type: String,
    },
    newValue: {
      type: String,
    },
    userName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

HistorySchema.index({ itemId: 1, createdAt: -1 });
// Purge automatique après 30 jours (TTL index)
HistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

const HistoryModel: Model<IHistory> = mongoose.model<IHistory>(
  "history",
  HistorySchema,
);

export default HistoryModel;
