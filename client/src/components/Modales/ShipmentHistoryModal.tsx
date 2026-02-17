import { useEffect, useState } from "react";
import axios from "axios";
import { X, Download, Archive, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import Portal from "../Portal";

interface ArchiveItem {
  _id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  shipmentCount: number;
  createdAt: string;
}

interface Props {
  onClose: () => void;
  /** Called after a successful archive+purge so the parent can refresh */
  onArchived?: () => void;
}

const ShipmentHistoryModal = ({ onClose, onArchived }: Props) => {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}api/shipments/archives`,
        { withCredentials: true },
      );
      setArchives(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setShowConfirm(false);
    setArchiving(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}api/shipments/archive`,
        {},
        { withCredentials: true },
      );
      toast.success("Envois archivés et purgés");
      await fetchArchives();
      onArchived?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Impossible d'archiver les envois";
      toast.error(msg);
    } finally {
      setArchiving(false);
    }
  };

  const handleDownload = async (id: string, title: string) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}api/shipments/archives/${id}/download`,
        { withCredentials: true, responseType: "blob" },
      );
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `envois-${title.replace(/[^a-zA-Z0-9àâéèêëïîôùûüç\s-]/g, "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de télécharger l'archive");
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm m-0 p-0"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-base font-semibold text-gray-800">
              Historique des envois
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 min-h-0">
            {/* Archive button */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={archiving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium rounded-lg border border-amber-200 transition-colors disabled:opacity-50"
            >
              {archiving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Archive size={14} />
              )}
              {archiving
                ? "Archivage en cours…"
                : "Archiver et purger les envois actuels"}
            </button>

            {/* Confirmation popup */}
            {showConfirm && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      Confirmer l'archivage
                    </p>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Tous les envois du mois en cours seront sauvegardés dans
                      un fichier PDF puis supprimés de la liste. Cette action
                      est irréversible.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleArchive}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                  >
                    Oui, archiver et purger
                  </button>
                </div>
              </div>
            )}

            {/* Archives list */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : archives.length === 0 ? (
              <div className="text-center py-8">
                <Archive size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Aucune archive</p>
                <p className="text-xs text-gray-400 mt-1">
                  Cliquez sur le bouton ci-dessus pour archiver les envois
                  actuels
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {archives.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {fmtDate(a.periodStart)} → {fmtDate(a.periodEnd)} ·{" "}
                        {a.shipmentCount} envoi{a.shipmentCount > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(a._id, a.title)}
                      className="shrink-0 ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-medium transition-colors"
                      title="Télécharger"
                    >
                      <Download size={13} />
                      .pdf
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default ShipmentHistoryModal;
