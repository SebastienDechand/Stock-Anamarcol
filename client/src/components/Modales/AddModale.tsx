import { useState, useRef, useEffect } from "react";
import { useAppDispatch } from "../../hooks/redux";
import { addItem, uploadItemPicture } from "../../actions/item.actions";
import { FOURNISSEURS, ETATS, MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "../../constants";
import { X, ImagePlus } from "lucide-react";

interface AddModalProps {
  onClose: () => void;
  posterId: string;
  modifierId: string;
}

const AddModal = ({ onClose, posterId, modifierId }: AddModalProps) => {
  const [name, setName] = useState("");
  const [supplier, setSupplier] = useState("");
  const [quantity, setQuantity] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const isFormValid = name && supplier && quantity && status;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFileError("");

    if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setFileError("Format non supporté. Utilisez JPG ou PNG.");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setFileError("Fichier trop volumineux (max 2.5 Mo).");
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError("");

    try {
      const newItem = await dispatch(
        addItem({
          name,
          supplier,
          quantity: Number(quantity),
          status,
          posterId,
          modifierId,
        }),
      );

      if (file && newItem?._id) {
        const data = new FormData();
        data.append("name", name);
        data.append("supplier", supplier);
        data.append("status", status);
        data.append("itemId", newItem._id);
        data.append("file", file);
        await dispatch(uploadItemPicture(data, newItem._id, modifierId));
      }

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
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="name" className={labelClass}>
              Dénomination
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={selectClass}
              placeholder="Nom de l'article"
            />
          </div>

          <div>
            <label htmlFor="supplier" className={labelClass}>
              Fournisseur
            </label>
            <select
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
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
            <label htmlFor="status" className={labelClass}>
              État
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
            <label htmlFor="quantity" className={labelClass}>
              Quantité
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              step="1"
              required
              className={selectClass}
              placeholder="0"
            />
          </div>

          <div>
            <label className={labelClass}>Image (optionnel)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 px-3 py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-colors"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Aperçu"
                  className="max-h-32 max-w-full object-contain rounded-lg"
                />
              ) : (
                <>
                  <ImagePlus size={24} className="text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Cliquez pour sélectionner une image
                  </span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpg,image/jpeg,image/png"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
            {fileError && (
              <p className="text-xs text-red-500 mt-1">{fileError}</p>
            )}
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
