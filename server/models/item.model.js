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
      unique: false,
    },
    quantite: {
      type: String,
      required: true,
    },
    fournisseur: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "./logo_small.jpg",
    },
    etat: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("item", ItemSchema);
