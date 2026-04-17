import { useLocation } from "react-router-dom";

/**
 * Hook pour vérifier si on est actuellement sur la page /surveillance
 * Utile pour éviter de charger les flux vidéo sur d'autres pages
 */
export function useIsOnSurveillancePage(): boolean {
  const location = useLocation();
  return location.pathname === "/surveillance";
}
