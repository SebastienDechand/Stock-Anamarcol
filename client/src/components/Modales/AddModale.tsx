import { useState } from "react";
import { useAppDispatch } from "../../hooks/redux";
import { addItem } from "../../actions/item.actions";
import { FOURNISSEURS, ETATS } from "../../constants";
import { X } from "lucide-react";

interface AddModalProps {
  onClose: () => void;
  posterId: string;
  modifierId: string;
}

const AddModal = ({ onClose, posterId, modifierId }: AddModalProps) => {
  const [denomination, setDenomination] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [quantite, setQuantite] = useState("");
  const [etat, setEtat] = useState("");
  const [error, setError] = useState("");

  const dispatch = useAppDispatch();
  const isFormValid = denomination && fournisseur && quantite && etat;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError("");

    try {
      await dispatch(
        addItem({
          denomination,
          fournisseur,
          quantite: Number(quantite),
          etat,
          posterId,
          modifierId,
        }),
      );
      onClose();
    } catch {
      setError("Erreur lors de l'ajout de l'article.");
    }
  };

  const selectClass =
    "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Ajouter un article
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="denomination" className={labelClass}>
              Dénomination
            </label>
            <input
              type="text"
              id="denomination"
              value={denomination}
              onChange={(e) => setDenomination(e.target.value)}
              className={selectClass}
              placeholder="Nom de l'article"
            />
          </div>

          <div>
            <label htmlFor="fournisseur" className={labelClass}>
              Fournisseur
            </label>
            <select
              id="fournisseur"
              value={fournisseur}
              onChange={(e) => setFournisseur(e.target.value)}
              className={selectClass}
            >
              <option value="">-- Sélectionner --</option>
              {FOURNISSEURS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="etat" className={labelClass}>
              État
            </label>
            <select
              id="etat"
              value={etat}
              onChange={(e) => setEtat(e.target.value)}
              className={selectClass}
            >
              <option value="">-- Sélectionner --</option>
              {ETATS.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantite" className={labelClass}>
              Quantité
            </label>
            <input
              type="number"
              id="quantite"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              min="0"
              step="1"
              required
              className={selectClass}
              placeholder="0"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Ajouter l'article
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddModal;
