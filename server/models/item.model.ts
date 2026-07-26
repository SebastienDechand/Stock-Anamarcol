import mongoose, { Document, Model, Schema } from 'mongoose';
import { SUPPLIERS, STATUSES, Supplier, Status } from '../constants';

export interface IItem extends Document {
  posterId?: string;
  modifierName?: string;
  name: string;
  quantity: number;
  supplier: Supplier;
  image?: string;
  status: Status;
  cgKit?: boolean;
  tpvKit?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItem>(
  {
    posterId: {
      type: String,
    },
    modifierName: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    supplier: {
      type: String,
      required: true,
      enum: SUPPLIERS,
      index: true,
    },
    image: {
      type: String,
      default: './logo_small.jpg',
    },
    status: {
      type: String,
      required: true,
      enum: STATUSES,
      index: true,
    },
    cgKit: {
      type: Boolean,
      default: false,
    },
    tpvKit: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for frequent filters
ItemSchema.index({ supplier: 1, status: 1, name: 1 });
// Index for low-stock queries
ItemSchema.index({ quantity: 1 });

const ItemModel: Model<IItem> = mongoose.model<IItem>('item', ItemSchema);

export default ItemModel;
