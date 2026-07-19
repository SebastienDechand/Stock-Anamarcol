import { Role } from '../constants/roles.constants';

export interface User {
  _id: string;
  username: string;
  email: string;
  picture?: string;
  position?: string;
  phone?: string;
  department?: string;
  roles?: Role[];
  createdAt?: string;
  updatedAt?: string;
}
