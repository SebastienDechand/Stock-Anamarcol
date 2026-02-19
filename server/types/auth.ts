import type { IUser } from "../models/user.model";
import type { Document } from "mongoose";
import type { Role } from "../constants";

export interface DecodedToken {
  id: string;
}

/** Lean user document returned by Mongoose `.lean()` — plain object, no methods. */
export type LeanUser = Omit<IUser, keyof Document> & {
  _id: import("mongoose").Types.ObjectId;
  role: Role;
  roles: Role[];
};
