const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    lien: {
      type: String,
    },
    picture: {
      type: String,
      default: "./uploads/profil/random-user.png",
    },
    poste: {
      type: String,
      max: 1024,
    },
    tel: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ContactModel = mongoose.model("contact", contactSchema);

module.exports = ContactModel;
