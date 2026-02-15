import mongoose, { Document, Model, Schema } from "mongoose";

export interface IItem extends Document {
  posterId?: string;
  modifierName?: string;
  denomination: string;
  quantite: number;
  fournisseur: string;
  image?: string;
  etat: string;
  prepaCG?: boolean;
  prepaTPV?: boolean;
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
      default: "",
    },
    denomination: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    quantite: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    fournisseur: {
      type: String,
      required: true,
      index: true,
    },
    image: {
      type: String,
      default: "./logo_small.jpg",
    },
    etat: {
      type: String,
      required: true,
      index: true,
    },
    prepaCG: {
      type: Boolean,
      default: false,
    },
    prepaTPV: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index composé pour les filtres fréquents
ItemSchema.index({ fournisseur: 1, etat: 1, denomination: 1 });
// Index pour les requêtes de stock bas
ItemSchema.index({ quantite: 1 });

const ItemModel: Model<IItem> = mongoose.model<IItem>("item", ItemSchema);

export default ItemModel;
