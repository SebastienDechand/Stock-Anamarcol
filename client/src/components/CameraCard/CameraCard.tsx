import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { getCameraStreamUrl } from "../../utils/cameraUtils";
import type { CameraConfig } from "../../constants/cameras.constants";

interface CameraCardProps {
  camera: CameraConfig;
  showHeader?: boolean;
  showFooter?: boolean;
  fullHeight?: boolean;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.3;

export default function CameraCard({
  camera,
  showHeader = true,
  showFooter = true,
  fullHeight = false,
}: CameraCardProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
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
      e.preventDefault();
      setZoom((prev) => {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev - e.deltaY * 0.001));
        if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
        else setOffset((o) => clampOffset(o.x, o.y, next));
        return next;
      });
    },
    [clampOffset],
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [zoom]);

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
      if (!dragging.current) return;
      e.preventDefault();
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
    setZoom((prev) => Math.min(MAX_ZOOM, parseFloat((prev + ZOOM_STEP).toFixed(2))));

  const zoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(MIN_ZOOM, parseFloat((prev - ZOOM_STEP).toFixed(2)));
      if (next === MIN_ZOOM) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="bg-white rounded-md shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow flex flex-col max-h-[80vh]">
      {showHeader && (
        <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-2 py-1 flex items-center justify-between shrink-0 gap-1">
          <h3 className="text-white font-semibold text-sm">{camera.name}</h3>
          <div className="flex items-center gap-1">
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
                title="Réinitialiser"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative w-full bg-black flex-1 overflow-hidden ${
          !fullHeight ? "aspect-video" : ""
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
        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs pointer-events-none">
          En direct
        </div>
      </div>

      {showFooter && (
        <div className="px-3 py-1 bg-gray-50 text-xs text-gray-600 border-t border-gray-100 break-all shrink-0">
          Port {camera.port}
        </div>
      )}
    </div>
  );
}
