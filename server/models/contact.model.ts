import mongoose, { Document, Model, Schema } from "mongoose";

export interface IContact extends Document {
  nom: string;
  email?: string;
  lien?: string;
  picture?: string;
  poste?: string;
  tel?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
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
      maxlength: 1024,
    },
    tel: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const ContactModel: Model<IContact> = mongoose.model<IContact>(
  "contact",
  contactSchema,
);

export default ContactModel;
