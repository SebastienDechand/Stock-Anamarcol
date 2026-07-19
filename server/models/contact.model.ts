import mongoose, { Document, Model, Schema } from "mongoose";

export interface IContact extends Document {
  name: string;
  email?: string;
  link?: string;
  picture?: string;
  position?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    link: {
      type: String,
    },
    picture: {
      type: String,
      default: "./uploads/profil/random-user.png",
    },
    position: {
      type: String,
      maxlength: 1024,
    },
    phone: {
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
