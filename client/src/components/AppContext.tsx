import { createContext, useState, useEffect, type ReactNode } from "react";
import axios from "axios";
import type { AuthContextType } from "../types";

export const UidContext = createContext<AuthContextType>({
  uid: null,
  role: null,
  isAdmin: false,
  isAuthLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}jwtid`, {
        withCredentials: true,
      })
      .then((res) => {
        setUid(res.data._id || res.data);
        setRole(res.data.role || "user");
      })
      .catch(() => {
        setUid(null);
        setRole(null);
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  const isAdmin = role === "admin";

  return (
    <UidContext.Provider value={{ uid, role, isAdmin, isAuthLoading }}>
      {children}
    </UidContext.Provider>
  );
};
