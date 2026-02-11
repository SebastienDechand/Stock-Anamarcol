const mongoose = require("mongoose");

const ItemSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  },
);

// Index composé pour les filtres fréquents
ItemSchema.index({ fournisseur: 1, etat: 1, denomination: 1 });
// Index pour les requêtes de stock bas
ItemSchema.index({ quantite: 1 });

module.exports = mongoose.model("item", ItemSchema);
