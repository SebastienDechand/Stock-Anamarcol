export interface AuthContextType {
  uid: string | null;
  role: string | null;
  isAdmin: boolean;
  isSuperadmin?: boolean;
  isAuthLoading: boolean;
}
