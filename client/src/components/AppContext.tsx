import { createContext, useState, useEffect, type ReactNode } from "react";
import axios from "axios";
import type { AuthContextType } from "../types";
import { Role } from "../constants";

export const UidContext = createContext<AuthContextType>({
  uid: null,
  role: null,
  isAdmin: false,
  isHotline: false,
  isAuthLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}jwtid`, {
        withCredentials: true,
      })
      .then((res) => {
        setUid(res.data._id || res.data);
        setRole((res.data.role || Role.USER) as Role);
      })
      .catch(() => {
        setUid(null);
        setRole(null);
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  const isAdmin = role === Role.ADMIN || role === Role.SUPERADMIN;
  const isSuperadmin = role === Role.SUPERADMIN;
  const isHotline = role === Role.HOTLINE;

  return (
    <UidContext.Provider
      value={{ uid, role, isAdmin, isSuperadmin, isHotline, isAuthLoading }}
    >
      {children}
    </UidContext.Provider>
  );
};
