import { useState, useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setModifierName,
  updateQuantite,
  updateQuantiteSuccess,
} from "../../actions/item.actions";
import { dateParser } from "../../Utils";
import { UidContext } from "../AppContext";
import { X, Pencil, Check } from "lucide-react";

const ItemModale = ({ onClose }) => {
  const dispatch = useDispatch();
  const authContext = useContext(UidContext);
  const isAdmin = authContext?.isAdmin;
  const { selectedItemInfo, selectedItemQuantite } = useSelector(
    (state) => state.itemReducer,
  );
  const modifierName = useSelector((state) => state.userReducer.pseudo);
  const [quantite, setQuantite] = useState(
    selectedItemInfo?.quantite ?? selectedItemQuantite ?? "",
  );
  const [updateForm, setUpdateForm] = useState(false);
  const posterId = selectedItemInfo?.posterId;
  const users = useSelector((state) => state.usersReducer || []);

  const matchingUser = users.find((u) => u._id === posterId);

  const handleUpdate = async () => {
    try {
      if (selectedItemInfo?._id) {
        await dispatch(
          updateQuantite(selectedItemInfo._id, quantite, modifierName),
        );
        setUpdateForm(false);
        dispatch(
          updateQuantiteSuccess(selectedItemInfo._id, quantite, modifierName),
        );
        dispatch(setModifierName(modifierName));
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la quantité :", error);
    }
  };

  useEffect(() => {
    if (selectedItemInfo?.quantite !== undefined) {
      setQuantite(selectedItemInfo.quantite);
    } else if (selectedItemQuantite !== undefined) {
      setQuantite(selectedItemQuantite);
    }
  }, [selectedItemInfo, selectedItemQuantite]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">
            Détail de l'article
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row">
          {/* Left — Image */}
          <div className="sm:w-2/5 bg-gray-50 flex flex-col items-center justify-center p-6">
            {selectedItemInfo?.image ? (
              <img
                src={selectedItemInfo.image}
                alt="Article"
                className="max-h-48 max-w-full object-contain rounded-lg"
              />
            ) : (
              <p className="text-sm text-gray-400">Aucune image</p>
            )}
            {isAdmin && (
              <p className="text-[11px] text-gray-400 mt-3 text-center">
                Créé par {matchingUser?.pseudo || "–"} le{" "}
                {dateParser(selectedItemInfo?.createdAt || "")}
              </p>
            )}
          </div>

          {/* Right — Info */}
          <div className="sm:w-3/5 px-6 py-5 space-y-4">
            <InfoRow
              label="Dénomination"
              value={selectedItemInfo?.denomination}
            />
            <InfoRow
              label="Fournisseur"
              value={selectedItemInfo?.fournisseur}
            />
            <InfoRow label="État" value={selectedItemInfo?.etat} />

            {/* Quantity */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Quantité
              </p>
              {updateForm ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                    className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                  />
                  <button
                    onClick={handleUpdate}
                    className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setUpdateForm(false)}
                    className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold ${
                      Number(selectedItemInfo?.quantite) < 5
                        ? "text-red-600"
                        : "text-gray-800"
                    }`}
                  >
                    {selectedItemInfo?.quantite ?? "–"}
                  </span>
                  <button
                    onClick={() => setUpdateForm(true)}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    <Pencil size={12} />
                    Modifier
                  </button>
                </div>
              )}
            </div>

            {isAdmin && selectedItemInfo?.modifierName && (
              <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                Modifié par {selectedItemInfo.modifierName} le{" "}
                {dateParser(selectedItemInfo?.updatedAt || "")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-gray-800">{value || "–"}</p>
    </div>
  );
}

export default ItemModale;
