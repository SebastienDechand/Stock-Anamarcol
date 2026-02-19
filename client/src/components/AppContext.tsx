import { createContext, useState, useEffect, type ReactNode } from "react";
import axios from "axios";
import type { AuthContextType } from "../types";
import { Role } from "../constants";

export const UidContext = createContext<AuthContextType>({
  uid: null,
  roles: [],
  isAdmin: false,
  isHotline: false,
  isAuthLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [uid, setUid] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}jwtid`, {
        withCredentials: true,
      })
      .then((res) => {
        setUid(res.data._id || res.data);
        const r: Role[] =
          Array.isArray(res.data.roles) && res.data.roles.length > 0
            ? res.data.roles
            : [Role.USER];
        setRoles(r);
      })
      .catch(() => {
        setUid(null);
        setRoles([]);
      })
      .finally(() => setIsAuthLoading(false));
  }, []);

  const isAdmin = roles.includes(Role.ADMIN) || roles.includes(Role.SUPERADMIN);
  const isSuperadmin = roles.includes(Role.SUPERADMIN);
  const isHotline =
    roles.includes(Role.HOTLINE) ||
    roles.includes(Role.ADMIN) ||
    roles.includes(Role.SUPERADMIN);
  const isMonteur =
    roles.includes(Role.MONTEUR) ||
    roles.includes(Role.ADMIN) ||
    roles.includes(Role.SUPERADMIN);

  return (
    <UidContext.Provider
      value={{
        uid,
        roles,
        isAdmin,
        isSuperadmin,
        isHotline,
        isMonteur,
        isAuthLoading,
      }}
    >
      {children}
    </UidContext.Provider>
  );
};
