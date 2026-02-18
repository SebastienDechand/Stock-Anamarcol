import mongoose, { Document, Model, Schema } from "mongoose";
import { isEmail } from "validator";
import bcrypt from "bcrypt";
import { Role, ROLES } from "../constants";

export interface IUser extends Document {
  pseudo: string;
  email: string;
  password: string;
  picture?: string;
  poste?: string;
  numero?: string;
  pole?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUser> {
  login(email: string, password: string): Promise<IUser>;
}

const userSchema = new Schema<IUser, IUserModel>(
  {
    pseudo: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 30,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      validate: [isEmail, "Invalid email"],
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      maxlength: 1024,
      minlength: 6,
    },
    picture: {
      type: String,
      default: "./uploads/profil/random-user.png",
    },
    poste: {
      type: String,
      maxlength: 1024,
    },
    numero: {
      type: String,
    },
    pole: {
      type: String,
      enum: [
        "Direction",
        "Hotline",
        "Entrepôt",
        "Monteur",
        "Gestion du site",
        "",
      ],
      default: "",
    },
    role: {
      type: String,
      enum: ROLES,
      default: Role.USER,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password (only if modified)
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
});

// Verify password on login
userSchema.statics.login = async function (
  email: string,
  password: string,
): Promise<IUser> {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error("Incorrect password");
  }
  throw Error("Incorrect email");
};

const UserModel = mongoose.model<IUser, IUserModel>("user", userSchema);

export default UserModel;
