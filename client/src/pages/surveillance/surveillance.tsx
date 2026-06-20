import { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { UidContext } from "../../components/AppContext";
import CameraCard from "../../components/CameraCard/CameraCard";
import AccessDenied from "../../components/AccessDenied/AccessDenied";
import { AlertCircle, Monitor } from "lucide-react";
import { CAMERAS_CONFIG } from "../../constants/cameras.constants";

export default function Surveillance() {
  const auth = useContext(UidContext);
  const [searchParams] = useSearchParams();

  const isAuthorized = auth?.isAdmin || auth?.isSuperadmin;

  if (!isAuthorized) {
    return <AccessDenied />;
  }

  // Mode flux seul — ?flux=camera_id
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

  const displayedCameras = CAMERAS_CONFIG;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-4 pt-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Monitor size={20} className="text-brand-600 shrink-0" />
              Surveillance
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Affichage en continu des caméras de l'entreprise
            </p>
          </div>

        </div>
      </div>

      {/* Cameras Grid */}
      <div className="flex-1 overflow-y-auto pb-6">
        {displayedCameras.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {displayedCameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
              />
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
