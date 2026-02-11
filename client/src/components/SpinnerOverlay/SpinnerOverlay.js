import ClipLoader from "react-spinners/ClipLoader";

export default function SpinnerOverlay({ text = "Chargement..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <ClipLoader color="#85a55e" size={48} />
      <p className="mt-4 text-sm text-gray-500 font-medium">{text}</p>
    </div>
  );
}
