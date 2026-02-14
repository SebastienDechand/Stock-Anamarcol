import { useState } from "react";
import axios from "axios";
import { X, Download } from "lucide-react";
import {
  exportToXLSX,
  exportToPDF,
  exportToJSON,
} from "../../utils/export.utils";
import { exportItemsToCSV } from "../../utils/csv.utils";
import type { Item } from "../../types";

interface Props {
  onClose: () => void;
}

const ExportOptionsModal = ({ onClose }: Props) => {
  const [format, setFormat] = useState<"xlsx" | "csv" | "pdf" | "json">("xlsx");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}api/item/?limit=9999`,
      );
      const data: Item[] = Array.isArray(res.data)
        ? res.data
        : res.data.items || [];
      if (format === "csv") {
        exportItemsToCSV(data);
      } else if (format === "xlsx") {
        await exportToXLSX(data);
      } else if (format === "pdf") {
        await exportToPDF(data);
      } else if (format === "json") {
        exportToJSON(data);
      }
      onClose();
    } catch (e) {
      // silent fail for now
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
            Exporter les articles
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="format"
                  value="xlsx"
                  checked={format === "xlsx"}
                  onChange={() => setFormat("xlsx")}
                />
                <span className="text-sm">Excel (.xlsx) - recommandé</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={() => setFormat("csv")}
                />
                <span className="text-sm">CSV (.csv) - léger</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === "pdf"}
                  onChange={() => setFormat("pdf")}
                />
                <span className="text-sm">PDF - format imprimable</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Download size={14} />
              {loading ? "Export en cours..." : "Exporter"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsModal;
