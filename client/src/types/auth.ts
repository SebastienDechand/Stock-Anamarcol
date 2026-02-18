import type { Role } from "../constants";

export interface AuthContextType {
  uid: string | null;
  role: Role | null;
  isAdmin: boolean;
  isSuperadmin?: boolean;
  isHotline?: boolean;
  isAuthLoading: boolean;
}
