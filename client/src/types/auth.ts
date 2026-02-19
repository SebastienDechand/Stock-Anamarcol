import type { Role } from "../constants";

export interface AuthContextType {
  uid: string | null;
  roles: Role[];
  isAdmin: boolean;
  isSuperadmin?: boolean;
  isHotline?: boolean;
  isMonteur?: boolean;
  isAuthLoading: boolean;
}
