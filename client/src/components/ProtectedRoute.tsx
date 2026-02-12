import { useContext, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { UidContext } from "./AppContext";
import SpinnerOverlay from "./SpinnerOverlay/SpinnerOverlay";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { uid, isAuthLoading } = useContext(UidContext);

  if (isAuthLoading) {
    return <SpinnerOverlay text="Chargement de la session..." />;
  }

  if (!uid) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
