import { useContext, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { UidContext } from "./AppContext";
import SpinnerOverlay from "./SpinnerOverlay/SpinnerOverlay";

interface Props {
  children: ReactNode;
  superAdminOnly?: boolean;
}

export default function AdminRoute({ children, superAdminOnly = false }: Props) {
  const { uid, isAdmin, isSuperadmin, isAuthLoading } = useContext(UidContext);

  if (isAuthLoading) {
    return <SpinnerOverlay text="Chargement de la session..." />;
  }

  if (!uid) {
    return <Navigate to="/" replace />;
  }

  if (superAdminOnly ? !isSuperadmin : !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
