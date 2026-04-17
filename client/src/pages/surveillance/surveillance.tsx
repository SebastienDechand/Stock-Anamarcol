import { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { UidContext } from "../../components/AppContext";
import CameraCard from "../../components/CameraCard/CameraCard";
import AccessDenied from "../../components/AccessDenied/AccessDenied";
import { AlertCircle, Monitor } from "lucide-react";
import { CAMERAS_CONFIG } from "../../constants/cameras.constants";
import { useMotionDetection } from "../../hooks/useMotionDetection";

function GlobalMotionSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function Surveillance() {
  const auth = useContext(UidContext);
  const [searchParams] = useSearchParams();
  const {
    globalEnabled,
    loading,
    toggleGlobal,
    toggleCamera,
    isCameraEnabled,
  } = useMotionDetection();

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

          {/* Global motion detection toggle */}
          {!loading && (
            <div className="flex items-center gap-2 shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 self-start md:self-auto">
              <span className="text-sm text-gray-700 font-medium">
                Détection de mouvement
              </span>
              <GlobalMotionSwitch
                checked={globalEnabled}
                onChange={toggleGlobal}
              />
              {globalEnabled && (
                <span className="text-xs text-green-600 font-medium">
                  Activée
                </span>
              )}
            </div>
          )}
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
                globalMotionEnabled={globalEnabled}
                motionEnabled={isCameraEnabled(camera.id)}
                onMotionToggle={(enabled) => toggleCamera(camera.id, enabled)}
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
