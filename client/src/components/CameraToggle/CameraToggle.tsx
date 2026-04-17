interface CameraToggleProps {
  cameras: Array<{ id: string; name: string }>;
  selectedId: string;
  onSelectId: (id: string) => void;
}

export default function CameraToggle({
  cameras,
  selectedId,
  onSelectId,
}: CameraToggleProps) {
  return (
    <div className="flex gap-2 mb-4">
      {cameras.map((camera) => (
        <button
          key={camera.id}
          onClick={() => onSelectId(camera.id)}
          className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${
            selectedId === camera.id
              ? "bg-brand-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {camera.name}
        </button>
      ))}
    </div>
  );
}
