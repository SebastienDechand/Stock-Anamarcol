import { useState, useEffect, useContext, useRef } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import {
  setSelectedItemId,
  updateItem,
  updateQuantite,
  uploadItemPicture,
  fetchItemHistory,
} from "../../actions/item.actions";
import { dateParser } from "../../Utils";
import { UidContext } from "../AppContext";
import { X, Pencil, Check, ImagePlus, Clock, Loader2 } from "lucide-react";
import {
  FOURNISSEURS,
  ETATS,
  MAX_FILE_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from "../../constants";
import type { History, ItemState, User } from "../../types";

interface ItemModaleProps {
  onClose: () => void;
  itemId?: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  denomination: "Dénomination",
  fournisseur: "Fournisseur",
  etat: "État",
  quantite: "Quantité",
  prepaCG: "Prépa CG",
  prepaTPV: "Prépa TPV",
  image: "Image",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  quantity_change: "Quantité",
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700",
  update: "bg-blue-100 text-blue-700",
  delete: "bg-red-100 text-red-700",
  quantity_change: "bg-amber-100 text-amber-700",
};

const ItemModale = ({ onClose }: ItemModaleProps) => {
  const dispatch = useAppDispatch();
  const authContext = useContext(UidContext);
  const isAdmin = authContext?.isAdmin;
  const { selectedItemInfo, selectedItemQuantite, history, isLoadingHistory } =
    useSelector((state: { itemReducer: ItemState }) => state.itemReducer);
  const modifierName = useSelector(
    (state: { userReducer: Partial<User> }) => state.userReducer.pseudo,
  );
  const userId = useSelector(
    (state: { userReducer: Partial<User> }) => state.userReducer._id,
  );
  const posterId = selectedItemInfo?.posterId;
  const users = useSelector(
    (state: { usersReducer: User[] }) => state.usersReducer || [],
  );

  const matchingUser = Array.isArray(users)
    ? users.find((u) => u._id === posterId)
    : undefined;

  // Tab state
  const [activeTab, setActiveTab] = useState<"detail" | "history">("detail");
  const [historyFetched, setHistoryFetched] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editingQty, setEditingQty] = useState(false);
  const [denomination, setDenomination] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [etat, setEtat] = useState("");
  const [quantite, setQuantite] = useState<number | string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form fields when item info changes
  useEffect(() => {
    if (selectedItemInfo) {
      setDenomination(selectedItemInfo.denomination || "");
      setFournisseur(selectedItemInfo.fournisseur || "");
      setEtat(selectedItemInfo.etat || "");
      setQuantite(selectedItemInfo.quantite ?? selectedItemQuantite ?? "");
    }
  }, [selectedItemInfo, selectedItemQuantite]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Lazy-load history when switching to history tab
  const handleTabChange = (tab: "detail" | "history") => {
    setActiveTab(tab);
    if (tab === "history" && !historyFetched && selectedItemInfo?._id) {
      dispatch(fetchItemHistory(selectedItemInfo._id));
      setHistoryFetched(true);
    }
  };

  const startEditing = () => {
    setEditing(true);
    setError("");
  };

  const cancelEditing = () => {
    if (selectedItemInfo) {
      setDenomination(selectedItemInfo.denomination || "");
      setFournisseur(selectedItemInfo.fournisseur || "");
      setEtat(selectedItemInfo.etat || "");
      setQuantite(selectedItemInfo.quantite ?? "");
    }
    setEditing(false);
    setEditingQty(false);
    setError("");
  };

  const handleSave = async () => {
    if (!selectedItemInfo?._id || !modifierName) return;
    if (!denomination.trim() || !fournisseur || !etat) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      await dispatch(
        updateItem(selectedItemInfo._id, {
          denomination: denomination.trim(),
          fournisseur,
          etat,
          quantite: Math.max(0, parseInt(String(quantite), 10) || 0),
          modifierName,
        }),
      );
      await dispatch(setSelectedItemId(selectedItemInfo._id));
      setEditing(false);
      setHistoryFetched(false);
    } catch {
      setError("Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQty = async () => {
    if (!selectedItemInfo?._id || !modifierName) return;
    const newQty = Math.max(0, parseInt(String(quantite), 10) || 0);
    setIsSaving(true);
    setError("");
    try {
      await dispatch(
        updateQuantite(selectedItemInfo._id, newQty, modifierName),
      );
      await dispatch(setSelectedItemId(selectedItemInfo._id));
      setEditingQty(false);
      setHistoryFetched(false);
    } catch {
      setError("Erreur lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !selectedItemInfo?._id || !userId) return;
    setFileError("");

    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        selectedFile.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
      )
    ) {
      setFileError("Format non supporté. Utilisez JPG ou PNG.");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError("Fichier trop volumineux (max 2.5 Mo).");
      return;
    }

    setImagePreview(URL.createObjectURL(selectedFile));
    setIsUploading(true);

    try {
      const data = new FormData();
      data.append("denomination", selectedItemInfo.denomination);
      data.append("fournisseur", selectedItemInfo.fournisseur);
      data.append("etat", selectedItemInfo.etat);
      data.append("itemId", selectedItemInfo._id);
      data.append("file", selectedFile);
      await dispatch(uploadItemPicture(data, selectedItemInfo._id, userId));
      await dispatch(setSelectedItemId(selectedItemInfo._id));
      setImagePreview(null);
    } catch {
      setFileError("Erreur lors de l'upload de l'image.");
    } finally {
      setIsUploading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent";
  const labelClass =
    "text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5";

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
            {editing ? "Modifier l'article" : "Détail de l'article"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs (admin only) */}
        {isAdmin && (
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => handleTabChange("detail")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "detail"
                  ? "text-brand-600 border-b-2 border-brand-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              Détail
            </button>
            <button
              onClick={() => handleTabChange("history")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "history"
                  ? "text-brand-600 border-b-2 border-brand-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Clock size={14} />
              Historique
            </button>
          </div>
        )}

        {/* Detail tab */}
        {activeTab === "detail" && (
          <div className="flex flex-col sm:flex-row">
            {/* Left — Image */}
            <div className="sm:w-2/5 bg-gray-50 flex flex-col items-center justify-center p-6">
              <div
                onClick={() => isAdmin && fileInputRef.current?.click()}
                className={`relative w-full flex items-center justify-center ${
                  isAdmin ? "cursor-pointer group/img" : ""
                }`}
              >
                {imagePreview || selectedItemInfo?.image ? (
                  <img
                    src={imagePreview || selectedItemInfo?.image}
                    alt="Article"
                    className={`max-h-48 max-w-full object-contain rounded-lg transition-opacity ${
                      isUploading ? "opacity-50" : ""
                    }`}
                  />
                ) : (
                  <p className="text-sm text-gray-400">Aucune image</p>
                )}
                {isAdmin && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/img:bg-black/30 rounded-lg transition-colors">
                    <ImagePlus
                      size={24}
                      className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                    />
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpg,image/jpeg,image/png"
                className="hidden"
                onChange={handleFileSelect}
              />
              {fileError && (
                <p className="text-xs text-red-500 mt-2">{fileError}</p>
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
              {/* Dénomination */}
              <div>
                <p className={labelClass}>Dénomination</p>
                {editing ? (
                  <input
                    type="text"
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-sm text-gray-800">
                    {selectedItemInfo?.denomination || "–"}
                  </p>
                )}
              </div>

              {/* Fournisseur */}
              <div>
                <p className={labelClass}>Fournisseur</p>
                {editing ? (
                  <select
                    value={fournisseur}
                    onChange={(e) => setFournisseur(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">-- Sélectionner --</option>
                    {FOURNISSEURS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-800">
                    {selectedItemInfo?.fournisseur || "–"}
                  </p>
                )}
              </div>

              {/* État */}
              <div>
                <p className={labelClass}>État</p>
                {editing ? (
                  <select
                    value={etat}
                    onChange={(e) => setEtat(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">-- Sélectionner --</option>
                    {ETATS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-800">
                    {selectedItemInfo?.etat || "–"}
                  </p>
                )}
              </div>

              {/* Quantité */}
              <div>
                <p className={labelClass}>Quantité</p>
                {editing || editingQty ? (
                  <input
                    type="number"
                    min="0"
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <span
                    className={`text-sm font-bold ${
                      Number(selectedItemInfo?.quantite) < 5
                        ? "text-red-600"
                        : "text-gray-800"
                    }`}
                  >
                    {selectedItemInfo?.quantite ?? "–"}
                  </span>
                )}
              </div>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* Actions */}
              {isAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Check size={14} />
                        {isSaving ? "Enregistrement..." : "Enregistrer"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                      >
                        <X size={14} />
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      <Pencil size={12} />
                      Modifier
                    </button>
                  )}
                </div>
              )}
              {!isAdmin && (
                <div className="flex items-center gap-2 pt-1">
                  {editingQty ? (
                    <>
                      <button
                        onClick={handleSaveQty}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Check size={14} />
                        {isSaving ? "Enregistrement..." : "Enregistrer"}
                      </button>
                      <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-lg transition-colors"
                      >
                        <X size={14} />
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingQty(true)}
                      className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium"
                    >
                      <Pencil size={12} />
                      Modifier la quantité
                    </button>
                  )}
                </div>
              )}

              {isAdmin && selectedItemInfo?.modifierName && (
                <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                  Modifié par {selectedItemInfo.modifierName} le{" "}
                  {dateParser(selectedItemInfo?.updatedAt || "")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* History tab */}
        {activeTab === "history" && (
          <div className="px-6 py-5 max-h-[400px] overflow-y-auto">
            {isLoadingHistory && (
              <div className="flex items-center justify-center py-8">
                <Loader2
                  size={24}
                  className="animate-spin text-brand-600"
                />
              </div>
            )}

            {!isLoadingHistory && history.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">
                Aucun historique pour cet article.
              </p>
            )}

            {!isLoadingHistory && history.length > 0 && (
              <div className="space-y-3">
                {history.map((entry: History) => (
                  <div
                    key={entry._id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                    <div className="flex-1 min-w-0">
                      {entry.action === "create" && (
                        <p className="text-sm text-gray-700">
                          Article créé
                        </p>
                      )}
                      {entry.action === "delete" && (
                        <p className="text-sm text-gray-700">
                          Article supprimé
                          {entry.oldValue && (
                            <span className="text-gray-400">
                              {" "}({entry.oldValue})
                            </span>
                          )}
                        </p>
                      )}
                      {(entry.action === "update" ||
                        entry.action === "quantity_change") && (
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">
                            {FIELD_LABELS[entry.field || ""] || entry.field}
                          </span>
                          {" : "}
                          <span className="text-red-500 line-through">
                            {entry.oldValue}
                          </span>
                          {" → "}
                          <span className="text-green-600 font-medium">
                            {entry.newValue}
                          </span>
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {entry.userName} &middot;{" "}
                        {dateParser(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemModale;
