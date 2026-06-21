import { Role } from '../constants/roles.constants';

export interface User {
  _id: string;
  pseudo: string;
  email: string;
  picture?: string;
  poste?: string;
  numero?: string;
  pole?: string;
  roles?: Role[];
  createdAt?: string;
  updatedAt?: string;
}
