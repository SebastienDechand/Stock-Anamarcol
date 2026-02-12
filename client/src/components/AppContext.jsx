import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UidContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [uid, setUid] = useState(null);
  const [role, setRole] = useState(null);
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
