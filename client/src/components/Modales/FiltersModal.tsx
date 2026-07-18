import { useState } from "react";
import { X } from "lucide-react";
import { FOURNISSEURS, ETATS } from "../../constants";

interface Props {
  onClose: () => void;
  search: string;
  supplierFilter: string[];
  statusFilter: string[];
  prepaFilter: string[];
  onApply: (s: string, f: string[], e: string[], p: string[]) => void;
}

const FiltersModal = ({
  onClose,
  search,
  supplierFilter,
  statusFilter,
  prepaFilter,
  onApply,
}: Props) => {
  const [localSearch, setLocalSearch] = useState(search);
  const [localF, setLocalF] = useState<string[]>([...supplierFilter]);
  const [localE, setLocalE] = useState<string[]>([...statusFilter]);
  const [localP, setLocalP] = useState<string[]>([...prepaFilter]);

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Filtres</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recherche
            </label>
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fournisseurs
            </label>
            <div className="flex flex-wrap gap-2">
              {FOURNISSEURS.map((f) => (
                <button
                  key={f}
                  onClick={() => toggle(localF, setLocalF, f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${localF.includes(f) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-gray-600 border-gray-200"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              État
            </label>
            <div className="flex flex-wrap gap-2">
              {ETATS.map((e) => (
                <button
                  key={e}
                  onClick={() => toggle(localE, setLocalE, e)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${localE.includes(e) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Préparations
            </label>
            <div className="flex flex-wrap gap-2">
              {["CashGuard", "Caisse TPV"].map((p) => (
                <button
                  key={p}
                  onClick={() => setLocalP(localP.includes(p) ? [] : [p])}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${localP.includes(p) ? "bg-violet-600 text-white border-violet-600" : "bg-white text-gray-600 border-gray-200"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onApply(localSearch, localF, localE, localP);
                onClose();
              }}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg"
            >
              Appliquer
            </button>
            <button
              onClick={() => {
                setLocalSearch("");
                setLocalF([]);
                setLocalE([]);
                setLocalP([]);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
            >
              Réinitialiser
            </button>
            <button
              onClick={onClose}
              className="ml-auto px-4 py-2 bg-white border border-gray-200 rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FiltersModal;
