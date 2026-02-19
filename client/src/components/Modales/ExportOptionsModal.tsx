import { useState } from "react";
import axios from "axios";
import {
  X,
  Download,
  FileSpreadsheet,
  FileText,
  FileType2,
  Braces,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Portal from "../Portal";
import {
  exportToXLSX,
  exportToPDF,
  exportToJSON,
} from "../../utils/export.utils";
import { exportItemsToCSV } from "../../utils/csv.utils";
import type { Item } from "../../types";
import type { ExportFormat } from "../../types/shipment";

interface Props {
  onClose: () => void;
  title?: string;
  onExport?: (format: ExportFormat) => Promise<void>;
  formats?: ExportFormat[];
}

interface FormatOption {
  id: ExportFormat;
  label: string;
  ext: string;
  desc: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const ALL_FORMATS: FormatOption[] = [
  {
    id: "xlsx",
    label: "Excel",
    ext: ".xlsx",
    desc: "Tableau complet, formules, mise en forme",
    icon: <FileSpreadsheet size={20} />,
    badge: "Recommandé",
    badgeColor: "bg-green-50 text-green-700",
  },
  {
    id: "csv",
    label: "CSV",
    ext: ".csv",
    desc: "Texte brut, compatible tous logiciels",
    icon: <FileText size={20} />,
  },
  {
    id: "pdf",
    label: "PDF",
    ext: ".pdf",
    desc: "Format imprimable, lecture seule",
    icon: <FileType2 size={20} />,
  },
  {
    id: "json",
    label: "JSON",
    ext: ".json",
    desc: "Données brutes, usage technique",
    icon: <Braces size={20} />,
  },
];

const ExportOptionsModal = ({ onClose, title, onExport, formats }: Props) => {
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [loading, setLoading] = useState(false);

  const visibleFormats = ALL_FORMATS.filter(
    (f) => !formats || formats.includes(f.id),
  );

  const handleExport = async () => {
    setLoading(true);
    try {
      if (onExport) {
        await onExport(format);
      } else {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}api/item/?limit=9999`,
        );
        const data: Item[] = Array.isArray(res.data)
          ? res.data
          : res.data.items || [];
        if (format === "csv") exportItemsToCSV(data);
        else if (format === "xlsx") await exportToXLSX(data);
        else if (format === "pdf") await exportToPDF(data);
        else if (format === "json") exportToJSON(data);
      }
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-50 text-brand-600">
                <Download size={16} />
              </div>
              <h2 className="text-sm font-semibold text-gray-800">
                {title || "Exporter les articles"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Format cards */}
          <div className="p-4 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Choisissez un format
            </p>
            {visibleFormats.map((opt) => {
              const selected = format === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFormat(opt.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    selected
                      ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg ${
                      selected
                        ? "bg-brand-100 text-brand-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${selected ? "text-brand-800" : "text-gray-800"}`}
                      >
                        {opt.label}
                      </span>
                      <span
                        className={`text-xs font-mono ${selected ? "text-brand-500" : "text-gray-400"}`}
                      >
                        {opt.ext}
                      </span>
                      {opt.badge && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${opt.badgeColor}`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {opt.desc}
                    </p>
                  </div>
                  {selected && (
                    <CheckCircle2
                      size={18}
                      className="flex-shrink-0 text-brand-500"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-4 pb-4">
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Export en cours…
                </>
              ) : (
                <>
                  <Download size={15} />
                  Exporter
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ExportOptionsModal;
