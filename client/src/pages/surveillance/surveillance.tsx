import { useState, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { UidContext } from "../../components/AppContext";
import CameraCard from "../../components/CameraCard/CameraCard";
import CameraToggle from "../../components/CameraToggle/CameraToggle";
import { AlertCircle, Monitor } from "lucide-react";
import { CAMERAS_CONFIG } from "../../constants/cameras.constants";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function Surveillance() {
  const auth = useContext(UidContext);
  const [searchParams] = useSearchParams();
  const [selectedCameraId, setSelectedCameraId] = useState<string>(
    CAMERAS_CONFIG[0].id,
  );
  const isMobile = useIsMobile();

  // Protéger la page - seulement admin et superadmin
  const isAuthorized = auth?.isAdmin || auth?.isSuperadmin;

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Accès refusé
          </h1>
          <p className="text-gray-600">
            Vous n'avez pas l'autorisation d'accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  // Mode flux seul - via le query parameter ?flux=camera_id
  const fluxMode = searchParams.get("flux");
  if (fluxMode) {
    const camera = CAMERAS_CONFIG.find((c) => c.id === fluxMode);
    if (!camera) {
      return (
        <div className="flex items-center justify-center h-screen bg-black">
          <p className="text-white">Caméra non trouvée</p>
        </div>
      );
    }
    return (
      <div className="w-full h-screen bg-black">
        <CameraCard camera={camera} showHeader={false} showFooter={false} />
      </div>
    );
  }

  // Caméras affichées selon le mode
  const displayedCameras = isMobile
    ? CAMERAS_CONFIG.filter((c) => c.id === selectedCameraId)
    : CAMERAS_CONFIG;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-2 pt-0">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Monitor size={20} className="text-brand-600 shrink-0" />
          Surveillance
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Affichage en continu des caméras de l'entreprise
        </p>
      </div>

      {/* Mobile Toggle */}
      {isMobile && (
        <div className="shrink-0 mb-2">
          <CameraToggle
            cameras={CAMERAS_CONFIG}
            selectedId={selectedCameraId}
            onSelectId={setSelectedCameraId}
          />
        </div>
      )}

      {/* Cameras Grid */}
      <div className="flex-1 overflow-hidden">
        {displayedCameras.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {displayedCameras.map((camera) => (
              <CameraCard key={camera.id} camera={camera} fullHeight={true} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune caméra configurée</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
