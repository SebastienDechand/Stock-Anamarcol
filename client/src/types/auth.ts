export interface AuthContextType {
  uid: string | null;
  role: string | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
}
