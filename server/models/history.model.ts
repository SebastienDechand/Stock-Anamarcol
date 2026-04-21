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
// Auto-purge after 60 days (TTL index)
HistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 3600 });

const HistoryModel: Model<IHistory> = mongoose.model<IHistory>(
  "history",
  HistorySchema,
);

// Ensure TTL index is properly created on connection
HistoryModel.collection.dropIndex("createdAt_1").catch(() => {
  // Index might not exist, that's fine
});
HistoryModel.collection.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 3600, name: "createdAt_ttl" },
);

export default HistoryModel;
