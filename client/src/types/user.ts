import type { Role } from "../constants";

export interface User {
  _id: string;
  pseudo: string;
  email: string;
  picture?: string;
  poste?: string;
  numero?: string;
  pole?: string;
  role?: Role;
  createdAt?: string;
  updatedAt?: string;
}
