export interface AuthContextType {
  uid: string | null;
  role: "superadmin" | "admin" | "user" | "hotline" | null;
  isAdmin: boolean;
  isSuperadmin?: boolean;
  isHotline?: boolean;
  isAuthLoading: boolean;
}
