import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Camera } from "lucide-react";
import { getCameraStreamUrl } from "../../utils/cameraUtils";
import { useIsOnSurveillancePage } from "../../hooks/useIsOnSurveillancePage";
import { useIntersectionObserver } from "../../hooks/useIntersectionObserver";
import type { CameraConfig } from "../../constants/cameras.constants";

interface CameraCardProps {
  camera: CameraConfig;
  showHeader?: boolean;
  showFooter?: boolean;
  fullHeight?: boolean;
  motionEnabled?: boolean;
  globalMotionEnabled?: boolean;
  onMotionToggle?: (enabled: boolean) => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.3;

function MotionSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      title={
        disabled
          ? "Activez la détection globale d'abord"
          : checked
            ? "Désactiver la détection"
            : "Activer la détection"
      }
      className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 ${
        checked && !disabled ? "bg-green-400" : "bg-white/30"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-3.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function CameraCard({
  camera,
  showHeader = true,
  showFooter = true,
  fullHeight = false,
  motionEnabled = false,
  globalMotionEnabled = false,
  onMotionToggle,
}: CameraCardProps) {
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading: only load camera stream when on /surveillance page AND element is visible
  const isOnSurveillancePage = useIsOnSurveillancePage();
  const { elementRef, isVisible } = useIntersectionObserver({
    threshold: 0.1,
  });
  const shouldLoadStream = isOnSurveillancePage && isVisible;

  // Sync zoom ref for non-React event listeners
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Prevent page scroll when hovering the video (or dragging if zoomed)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => e.preventDefault();
    const onTouchMove = (e: TouchEvent) => {
      // PreventDefault ONLY if the user is dragging a zoomed image,
      // otherwise allow page scrolling when simply touching the image at 100%
      if (zoomRef.current > 1 && dragging.current) {
        e.preventDefault();
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  const clampOffset = useCallback(
    (x: number, y: number, currentZoom: number) => {
      if (!containerRef.current) return { x, y };
      const { width, height } = containerRef.current.getBoundingClientRect();
      const maxX = (width * (currentZoom - 1)) / 2;
      const maxY = (height * (currentZoom - 1)) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
      };
    },
    [],
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // PreventDefault is handled via useEffect with passive: false to avoid console errors
      setZoom((prev) => {
        const next = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, prev - e.deltaY * 0.001),
        );
        if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
        else setOffset((o) => clampOffset(o.x, o.y, next));
        return next;
      });
    },
    [clampOffset],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      dragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    },
    [zoom],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      lastPos.current = { x: e.clientX, y: e.clientY };
      setOffset((o) => clampOffset(o.x + dx, o.y + dy, zoom));
    },
    [zoom, clampOffset],
  );

  const handleMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (zoom <= 1) return;
      const t = e.touches[0];
      dragging.current = true;
      lastPos.current = { x: t.clientX, y: t.clientY };
    },
    [zoom],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!dragging.current || zoom <= 1) return;
      // PreventDefault is handled via native event listener with passive: false
      const t = e.touches[0];
      const dx = t.clientX - lastPos.current.x;
      const dy = t.clientY - lastPos.current.y;
      lastPos.current = { x: t.clientX, y: t.clientY };
      setOffset((o) => clampOffset(o.x + dx, o.y + dy, zoom));
    },
    [zoom, clampOffset],
  );

  const handleTouchEnd = useCallback(() => {
    dragging.current = false;
  }, []);

  const zoomIn = () =>
    setZoom((prev) =>
      Math.min(MAX_ZOOM, parseFloat((prev + ZOOM_STEP).toFixed(2))),
    );

  const zoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(
        MIN_ZOOM,
        parseFloat((prev - ZOOM_STEP).toFixed(2)),
      );
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="bg-white w-full flex-col max-h-[80vh] rounded-md shadow-sm overflow-hidden border border-gray-200 flex">
      {showHeader && (
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-2 py-1 flex items-center justify-between shrink-0 gap-1">
          <h3 className="text-white font-semibold text-sm truncate">
            {camera.name}
          </h3>

          <div className="flex items-center gap-2 shrink-0">
            {/* Motion detection toggle */}
            {onMotionToggle && (
              <div className="flex items-center gap-1.5">
                <span className="text-white/70 text-xs">Mouvement</span>
                <MotionSwitch
                  checked={motionEnabled}
                  onChange={onMotionToggle}
                  disabled={!globalMotionEnabled}
                />
              </div>
            )}

            {/* Zoom controls */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                className="p-1 rounded-md hover:bg-brand-800 transition-colors text-white disabled:opacity-40"
                title="Dézoomer"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-white text-xs w-8 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                className="p-1 rounded-md hover:bg-brand-800 transition-colors text-white disabled:opacity-40"
                title="Zoomer"
              >
                <ZoomIn size={15} />
              </button>
              {zoom > 1 && (
                <button
                  onClick={reset}
                  className="p-1 rounded-md hover:bg-brand-800 transition-colors text-white"
                  title="Réinitialiser le zoom"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        ref={(el) => {
          // Combine both refs
          if (el) {
            containerRef.current = el;
            if (elementRef) {
              elementRef.current = el;
            }
          }
        }}
        className={`relative w-full bg-black overflow-hidden ${
          !fullHeight ? "aspect-video" : "flex-1"
        } ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {shouldLoadStream ? (
          <img
            src={getCameraStreamUrl(camera)}
            alt={camera.name}
            draggable={false}
            className="w-full h-full select-none"
            style={{
              objectFit: "contain",
              transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
              transformOrigin: "center",
              transition: dragging.current ? "none" : "transform 0.1s ease-out",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Camera size={32} className="opacity-50" />
              <span className="text-xs text-center px-4">
                {isOnSurveillancePage
                  ? "Caméra en cours de chargement..."
                  : "Caméra inactive (page surveillance uniquement)"}
              </span>
            </div>
          </div>
        )}

        {shouldLoadStream && (
          <>
            {/* Live badge */}
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs pointer-events-none">
              En direct
            </div>

            {/* Motion active indicator */}
            {globalMotionEnabled && motionEnabled && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded pointer-events-none">
                <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white text-xs">Détection active</span>
              </div>
            )}
          </>
        )}
      </div>

      {showFooter && (
        <div className="px-3 py-1 bg-gray-50 text-xs text-gray-600 border-t border-gray-100 break-all shrink-0">
          Port {camera.port}
        </div>
      )}
    </div>
  );
}
