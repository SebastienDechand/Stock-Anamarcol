import ClipLoader from "react-spinners/ClipLoader";
import "./SpinnerOverlay.css";

export default function SpinnerOverlay({ text = "Chargement..." }) {
  return (
    <div className="spinner-overlay">
      <ClipLoader color="#000" size={80} />
      <p>{text}</p>
    </div>
  );
}
