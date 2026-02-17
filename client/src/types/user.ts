export interface User {
  _id: string;
  pseudo: string;
  email: string;
  picture?: string;
  poste?: string;
  numero?: string;
  pole?: string;
  role?: "superadmin" | "admin" | "user" | "hotline";
  createdAt?: string;
  updatedAt?: string;
}
