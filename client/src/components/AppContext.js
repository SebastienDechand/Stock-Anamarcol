import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UidContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [uid, setUid] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}jwtid`, {
        withCredentials: true,
      })
      .then((res) => {
        console.log("✅ UID récupéré dans AuthProvider :", res.data);
        setUid(res.data);
      })
      .catch(() => setUid(null))
      .finally(() => setIsAuthLoading(false));
  }, []);

  return (
    <UidContext.Provider value={{ uid, isAuthLoading }}>
      {children}
    </UidContext.Provider>
  );
};
