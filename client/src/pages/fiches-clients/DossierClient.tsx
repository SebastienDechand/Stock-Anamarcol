import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import { UidContext } from "../../components/AppContext";
import AccessDenied from "../../components/AccessDenied/AccessDenied";
import {
  createInterventionReport,
  updateInterventionReport,
  deleteInterventionReport,
  setSelectedReport,
} from "../../actions/interventionReport.actions";
import { getAllClientFiles } from "../../actions/clientFile.actions";
import Portal from "../../components/Portal";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  ClipboardList,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Truck,
  Package,
  Check,
  CircleAlert,
  Send,
  UploadCloud,
  FileDown,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import type {
  ClientFile,
  ClientFilesState,
  InterventionReport,
  InterventionReportsState,
  CashguardUnit,
  Shipment,
  ClientFileDoc,
  ClientFileDocType,
} from "../../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const emptyUnit = (): CashguardUnit => ({
  nSerie: "",
  up: "",
  ub: "",
  k7Slots: ["", "", "", ""],
  assignedCaisses: [],
  hasPc: false,
});

function formatDate(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── 2-step Wizard: Préparation → Fiche technique ──────────────────────────────
function ReportWizardModal({
  clientFileId,
  clientLabel,
  existing,
  onClose,
}: {
  clientFileId: string;
  clientLabel: string;
  existing?: InterventionReport;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 1 state ──
  const [twCaisses, setTwCaisses] = useState<string[]>(() => {
    if (existing?.twCaisses?.length) return existing.twCaisses;
    const legacy = [
      existing?.twCaisse1,
      existing?.twCaisse2,
      existing?.twCaisse3,
    ].filter(Boolean) as string[];
    return legacy.length ? legacy : [""];
  });
  const [twPc, setTwPc] = useState(existing?.twPc ?? "");
  const [units, setUnits] = useState<CashguardUnit[]>(
    existing?.cashguardUnits?.length
      ? existing.cashguardUnits.map((u) => ({
          ...emptyUnit(),
          ...u,
          k7Slots: (u.k7Slots ?? ["", "", "", ""]) as [
            string,
            string,
            string,
            string,
          ],
        }))
      : [emptyUnit()],
  );
  const [expandedUnit, setExpandedUnit] = useState<number>(0);

  // ── Step 2 state ──
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [loading, setLoading] = useState(false);

  const setUnit = (idx: number, field: keyof CashguardUnit, value: unknown) =>
    setUnits((prev) =>
      prev.map((u, i) => (i === idx ? { ...u, [field]: value } : u)),
    );

  const setK7 = (unitIdx: number, slotIdx: number, val: string) =>
    setUnits((prev) =>
      prev.map((u, i) => {
        if (i !== unitIdx) return u;
        const slots = [...u.k7Slots] as [string, string, string, string];
        slots[slotIdx] = val;
        return { ...u, k7Slots: slots };
      }),
    );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        clientFile: clientFileId,
        twCaisses,
        twPc,
        cashguardUnits: units,
        notes,
      };
      if (existing) {
        await dispatch(
          updateInterventionReport(
            existing._id,
            payload,
          ) as unknown as Parameters<typeof dispatch>[0],
        );
        toast.success("Fiche technique mise à jour");
      } else {
        await dispatch(
          createInterventionReport(payload) as unknown as Parameters<
            typeof dispatch
          >[0],
        );
        toast.success("Fiche technique créée");
      }
      onClose();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {existing
                  ? "Modifier la fiche technique"
                  : "Nouvelle fiche technique"}
              </h3>
              <p className="text-xs text-brand-600 mt-0.5 flex items-center gap-1">
                <Building2 size={11} />
                {clientLabel}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                {[
                  { n: 1, label: "Préparation" },
                  { n: 2, label: "Notes" },
                ].map(({ n, label }, idx, arr) => (
                  <div key={n} className="flex items-center gap-1.5">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        step === n
                          ? "bg-brand-600 text-white"
                          : step > n
                            ? "bg-brand-100 text-brand-700"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          step === n
                            ? "bg-white/30"
                            : step > n
                              ? "bg-brand-200"
                              : "bg-gray-200"
                        }`}
                      >
                        {n}
                      </span>
                      {label}
                    </div>
                    {idx < arr.length - 1 && (
                      <span className="w-4 h-px bg-gray-200" />
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={onClose}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* ── ÉTAPE 1 : Préparation Matériel ── */}
            {step === 1 && (
              <div className="space-y-6">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Wrench size={16} className="text-brand-600" />
                  Préparation Matériel - Codes TW & CashGuard
                </p>

                {/* TW codes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
                      Codes TW
                    </p>
                    <button
                      type="button"
                      onClick={() => setTwCaisses((p) => [...p, ""])}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                    >
                      <Plus size={13} /> Ajouter une caisse
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {twCaisses.map((tw, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className={labelCls}>
                            TW Caisse {idx + 1}
                          </label>
                          <input
                            className={inputCls}
                            value={tw}
                            onChange={(e) =>
                              setTwCaisses((p) =>
                                p.map((v, i) =>
                                  i === idx ? e.target.value : v,
                                ),
                              )
                            }
                          />
                        </div>
                        {twCaisses.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setTwCaisses((p) => p.filter((_, i) => i !== idx))
                            }
                            className="mt-5 text-red-400 hover:text-red-600"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    <div>
                      <label className={labelCls}>TW PC</label>
                      <input
                        className={inputCls}
                        value={twPc}
                        onChange={(e) => setTwPc(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* CashGuard units */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
                      Unités CashGuard
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setUnits((p) => [...p, emptyUnit()]);
                        setExpandedUnit(units.length);
                      }}
                      className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                    >
                      <Plus size={13} /> Ajouter une unité
                    </button>
                  </div>
                  <div className="space-y-3">
                    {units.map((unit, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-xl overflow-hidden"
                      >
                        <div
                          className="flex items-center justify-between px-4 py-2.5 bg-gray-50 cursor-pointer"
                          onClick={() =>
                            setExpandedUnit(expandedUnit === idx ? -1 : idx)
                          }
                        >
                          <span className="text-sm font-medium text-gray-700">
                            Unité {idx + 1}
                            {unit.nSerie ? ` - N° ${unit.nSerie}` : ""}
                          </span>
                          <div className="flex items-center gap-3">
                            {units.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setUnits((p) =>
                                    p.filter((_, i) => i !== idx),
                                  );
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            {expandedUnit === idx ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </div>
                        </div>
                        {expandedUnit === idx && (
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className={labelCls}>UP</label>
                                <input
                                  className={inputCls}
                                  value={unit.up ?? ""}
                                  onChange={(e) =>
                                    setUnit(idx, "up", e.target.value)
                                  }
                                />
                              </div>
                              <div>
                                <label className={labelCls}>UB</label>
                                <input
                                  className={inputCls}
                                  value={unit.ub ?? ""}
                                  onChange={(e) =>
                                    setUnit(idx, "ub", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div>
                              <p className={`${labelCls} mb-2`}>
                                Cassettes - 4 slots
                              </p>
                              <div className="grid grid-cols-4 gap-2">
                                {unit.k7Slots.map((val, slotIdx) => (
                                  <div key={slotIdx}>
                                    <label className="text-[10px] text-gray-400 mb-0.5 block">
                                      S{slotIdx + 1}
                                    </label>
                                    <input
                                      className={inputCls}
                                      value={val}
                                      onChange={(e) =>
                                        setK7(idx, slotIdx, e.target.value)
                                      }
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>
                                Caisses assignées (séparées par des virgules)
                              </label>
                              <input
                                className={inputCls}
                                value={unit.assignedCaisses.join(", ")}
                                onChange={(e) =>
                                  setUnit(
                                    idx,
                                    "assignedCaisses",
                                    e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  )
                                }
                                placeholder="CAISSE 1, CAISSE 2…"
                              />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={unit.hasPc}
                                onChange={(e) =>
                                  setUnit(idx, "hasPc", e.target.checked)
                                }
                                className="w-4 h-4 rounded accent-brand-600"
                              />
                              PC Backoffice associé
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                  >
                    Suivant : Notes →
                  </button>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 2 : Notes & Finalisation ── */}
            {step === 2 && (
              <div className="space-y-6">
                <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText size={16} className="text-brand-600" />
                  Notes & Finalisation
                </p>

                {/* Recap of step 1 */}
                <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-xs text-brand-700 space-y-0.5">
                  <p className="font-semibold mb-1">
                    Récapitulatif - Préparation :
                  </p>
                  {twCaisses.filter(Boolean).map((tw, i) => (
                    <p key={i}>
                      TW Caisse {i + 1} :{" "}
                      <span className="font-mono font-medium">{tw}</span>
                    </p>
                  ))}
                  {twPc && (
                    <p>
                      TW PC :{" "}
                      <span className="font-mono font-medium">{twPc}</span>
                    </p>
                  )}
                  <p>
                    {units.length} unité{units.length > 1 ? "s" : ""} CashGuard
                    {units
                      .filter((u) => u.nSerie)
                      .map((u) => ` · N°${u.nSerie}`)
                      .join("")}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-brand-600 uppercase tracking-wide block mb-2">
                    Notes
                  </label>
                  <textarea
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-h-[120px] resize-y"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Remarques d'intervention, informations complémentaires…"
                  />
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ← Retour Préparation
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-5 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    {loading
                      ? "Enregistrement…"
                      : existing
                        ? "Mettre à jour"
                        : "Créer la fiche"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Report detail (full-width inline view) ───────────────────────────────────
function ReportDetailView({
  report,
  onEdit,
  onDelete,
  onBack,
}: {
  report: InterventionReport;
  onEdit?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}) {
  const sec =
    "text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-3";
  const row = (label: string, value?: string | null) =>
    value ? (
      <div className="flex gap-3 py-1.5 border-b border-gray-50 last:border-0">
        <span className="text-gray-400 w-44 shrink-0 text-sm">{label}</span>
        <span className="text-gray-800 font-medium text-sm break-all">
          {value}
        </span>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      {/* Top grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Infos + actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest">
              Informations générales
            </p>
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  onClick={onEdit}
                  title="Modifier"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                >
                  <Pencil size={12} /> Modifier
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  title="Supprimer"
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
          {row("Créé le", formatDate(report.createdAt))}
          {row("Par", report.createdBy)}
        </div>

        {/* TW */}
        {(() => {
          const caisses = report.twCaisses?.length
            ? report.twCaisses
            : ([report.twCaisse1, report.twCaisse2, report.twCaisse3].filter(
                Boolean,
              ) as string[]);
          if (!caisses.length && !report.twPc) return null;
          return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className={sec}>Codes TeamViewer</p>
              {caisses.map((tw, i) => row(`TW Caisse ${i + 1}`, tw))}
              {row("TW PC", report.twPc)}
            </div>
          );
        })()}
      </div>

      {/* CashGuard units */}
      {report.cashguardUnits.length > 0 && (
        <div>
          <p className={sec}>
            Unités CashGuard ({report.cashguardUnits.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.cashguardUnits.map((unit, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-1.5"
              >
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Unité {idx + 1}
                </p>
                {row("UP", unit.up)}
                {row("UB", unit.ub)}
                {unit.k7Slots?.some(Boolean) && (
                  <>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest pt-2 pb-0.5">
                      Cassettes
                    </p>
                    {unit.k7Slots.map((s, i) =>
                      row(`S${i + 1}`, s || undefined),
                    )}
                  </>
                )}
                {unit.assignedCaisses?.length > 0 &&
                  row("Caisses assignées", unit.assignedCaisses.join(", "))}
                {unit.hasPc && (
                  <p className="text-xs text-brand-600 font-medium pt-1">
                    PC Backoffice associé
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {report.notes && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className={sec}>Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {report.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tab types ────────────────────────────────────────────────────────────────
type Tab = "fiche" | "technique" | "envois" | "documents";

// ─── Main Dossier Client Page ─────────────────────────────────────────────────
export default function DossierClient() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const auth = useContext(UidContext);
  const isMonteur = !!auth?.isMonteur;
  const isAdmin = !!auth?.isAdmin;

  const clientFile = useSelector(
    (s: { clientFilesReducer: ClientFilesState }) =>
      s.clientFilesReducer.clientFiles.find((f) => f._id === id),
  );

  // ── Fiches techniques liées à cette fiche ─────────────────────────────────────
  const [linkedReports, setLinkedReports] = useState<InterventionReport[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("fiche");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editReport, setEditReport] = useState<
    InterventionReport | undefined
  >();
  const [detailReport, setDetailReport] = useState<InterventionReport | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteDocConfirm, setDeleteDocConfirm] = useState<string | null>(null);

  // ── Envois liés à cette fiche ─────────────────────────────────────────────────
  const [linkedShipments, setLinkedShipments] = useState<Shipment[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [detailShipment, setDetailShipment] = useState<Shipment | null>(null);

  // ── Protection d'accès ─────────────────────────────────────────────────────────
  if (!isMonteur) {
    return (
      <AccessDenied
        title="Accès monteur requis"
        message="Cette page est réservée aux monteurs."
      />
    );
  }

  const fetchLinkedReports = async () => {
    if (!id) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}api/intervention-reports?clientFileId=${id}`,
        { withCredentials: true },
      );
      setLinkedReports(res.data);
    } catch (err) {
      console.error("fetchLinkedReports:", err);
    }
  };

  useEffect(() => {
    fetchLinkedReports();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Documents — derived from Redux so they're always up to date ──────────────
  const documents: ClientFileDoc[] = clientFile?.documents ?? [];
  const [docUploading, setDocUploading] = useState(false);
  const [docType, setDocType] = useState<ClientFileDocType>("bdc");
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setShipmentsLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}api/shipments?clientFileId=${id}`, {
        withCredentials: true,
      })
      .then((res) => setLinkedShipments(res.data))
      .catch((err) => console.error(err))
      .finally(() => setShipmentsLoading(false));
  }, [id]);

  const markSentInDossier = async (shipmentId: string) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}api/shipments/${shipmentId}/sent`,
        {},
        { withCredentials: true },
      );
      setLinkedShipments((prev) =>
        prev.map((s) => (s._id === shipmentId ? res.data : s)),
      );
      toast.success("Marqué comme envoyé");
    } catch {
      toast.error("Impossible de marquer comme envoyé");
    }
  };

  const handleUploadDoc = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", docType);
    setDocUploading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}api/client-files/${id}/documents`,
        fd,
        { withCredentials: true },
      );
      dispatch(
        getAllClientFiles() as unknown as Parameters<typeof dispatch>[0],
      );
      toast.success("Document ajouté");
      setShowUploadForm(false);
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setDocUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_API_URL}api/client-files/${id}/documents/${docId}`,
        { withCredentials: true },
      );
      dispatch(
        getAllClientFiles() as unknown as Parameters<typeof dispatch>[0],
      );
      toast.success("Document supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (!isMonteur) return <Navigate to="/home" replace />;
  if (!id) return <Navigate to="/fiches-clients" replace />;
  if (!clientFile)
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ClipboardList size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Fiche client introuvable</p>
        <button
          onClick={() => navigate("/fiches-clients")}
          className="mt-4 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft size={14} /> Retour aux fiches
        </button>
      </div>
    );

  const clientLabel = [
    clientFile.nom.toUpperCase(),
    clientFile.prenom,
    clientFile.societe ? `- ${clientFile.societe}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleDeleteReport = async (reportId: string) => {
    try {
      await dispatch(
        deleteInterventionReport(reportId) as unknown as Parameters<
          typeof dispatch
        >[0],
      );
      setLinkedReports((prev) => prev.filter((r) => r._id !== reportId));
      toast.success("Fiche technique supprimée");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteConfirm(null);
    }
  };

  // ── Helpers for inline display ──────────────────────────────────────────────
  const sec =
    "text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-2 mt-5 first:mt-0";
  const row = (label: string, value?: string | number | null | boolean) => {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === false
    )
      return null;
    return (
      <div>
        <span className="text-[10px] text-gray-400 block leading-tight">
          {label}
        </span>
        <span className="text-xs text-gray-800 font-medium break-words leading-snug">
          {typeof value === "boolean" ? "Oui" : String(value)}
        </span>
      </div>
    );
  };

  const eq = clientFile.equipement;

  const tabs: {
    key: Tab;
    label: string;
    icon: typeof ClipboardList;
    count?: number;
  }[] = [
    { key: "fiche", label: "Fiche client", icon: ClipboardList },
    {
      key: "technique",
      label: "Fiche technique",
      icon: Wrench,
    },
    {
      key: "envois",
      label: "Envois",
      icon: Truck,
      count: linkedShipments.length,
    },
    {
      key: "documents",
      label: "Documents",
      icon: FileText,
      count: documents.length || undefined,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <button
            onClick={() => navigate("/fiches-clients")}
            className="mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            title="Retour"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight truncate">
              {clientFile.nom.toUpperCase()}
              {clientFile.prenom ? ` ${clientFile.prenom}` : ""}
            </h1>
            {clientFile.societe && (
              <p className="text-sm text-brand-600 flex items-center gap-1 mt-0.5 truncate">
                <Building2 size={13} className="shrink-0" />
                {clientFile.societe}
                {clientFile.nomMagasin ? ` · ${clientFile.nomMagasin}` : ""}
              </p>
            )}
            {(clientFile.ville || clientFile.cp) && (
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin size={11} />
                {[clientFile.cp, clientFile.ville].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
        </div>
        {isMonteur && (
          <button
            onClick={() => navigate("/fiches-clients")}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
            title="Modifier la fiche depuis la liste"
          >
            <Pencil size={13} />
            <span className="hidden sm:inline">Modifier la fiche</span>
          </button>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-1 border-b border-gray-200">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === key
                  ? "border-brand-600 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
              {count !== undefined && count > 0 && (
                <span className="absolute top-1 -right-0.5 min-w-[14px] h-3.5 flex items-center justify-center text-[9px] font-bold rounded-full bg-brand-500 text-white px-1 leading-none">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB : FICHE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "fiche" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {/* Quick info strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
            {[
              {
                label: "Téléphone",
                value: clientFile.mobile || clientFile.tel,
                icon: Phone,
              },
              { label: "Email", value: clientFile.email, icon: Mail },
              {
                label: "Installation",
                value: clientFile.dateInstallationSouhaitee,
                icon: ClipboardList,
              },
              {
                label: "Ouverture",
                value: clientFile.ouverturePrevue,
                icon: ClipboardList,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="px-4 py-3">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1">
                  <Icon size={10} />
                  {label}
                </p>
                <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">
                  {value || "-"}
                </p>
              </div>
            ))}
          </div>

          {/* Full details — info (top/left) + map (bottom/right) */}
          <div className="px-6 py-5 grid grid-cols-1 xl:grid-cols-[7fr_3fr] gap-6 items-start">
            {/* ── Info panel : 1 col → 2 cols → 3 cols → 2 cols (xl) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-2 gap-x-6 gap-y-6">
              {/* Identité */}
              <div className="space-y-1.5">
                <p className={sec}>Identité</p>
                {row("Raison sociale", clientFile.raisonSociale)}
                {row("Nom du magasin", clientFile.nomMagasin)}
                {row("SIRET", clientFile.siret)}
                {row("TVA Intra", clientFile.tvaIntra)}
                {row("Code NAF", clientFile.codeNaf)}
                {row("Statut juridique", clientFile.statutJuridique)}
              </div>

              {/* Coordonnées */}
              <div className="space-y-1.5">
                <p className={sec}>Coordonnées</p>
                {row("Adresse", clientFile.adresse)}
                {row(
                  "CP / Ville",
                  [clientFile.cp, clientFile.ville].filter(Boolean).join(" ") ||
                    undefined,
                )}
                {row("Téléphone", clientFile.tel)}
                {row("Mobile", clientFile.mobile)}
                {row("Email", clientFile.email)}
                {row("Jours de fermeture", clientFile.joursFermeture)}
              </div>

              {/* Planning */}
              <div className="space-y-1.5">
                <p className={sec}>Planning</p>
                {row(
                  "Installation souhaitée",
                  clientFile.dateInstallationSouhaitee,
                )}
                {row("Formation souhaitée", clientFile.dateFormationSouhaitee)}
                {row("Ouverture prévue", clientFile.ouverturePrevue)}
                {row(
                  "Visite préinstallation",
                  clientFile.visitePreinstallation || undefined,
                )}
                {row(
                  "Saisir fichier produit",
                  clientFile.saisirFichierProduit || undefined,
                )}
                {row(
                  "Découpe plan menuiserie",
                  clientFile.decoupePlanMenuiserie || undefined,
                )}
                {row(
                  "Découpe plan marbrerie",
                  clientFile.decoupePlanMarbrerie || undefined,
                )}
              </div>

              {/* Équipements — pleine largeur du panneau gauche */}
              <div className="space-y-1.5">
                <p className={sec}>Équipements commandés</p>
                <div className="grid grid-cols-2 gap-x-8">
                  <div className="space-y-1.5">
                    {row("CashGuard", eq.nbCashguard || undefined)}
                    {row("Caisses", eq.nbCaisses || undefined)}
                    {row(
                      "Balances / Caisses",
                      eq.nbBalancesCaisses || undefined,
                    )}
                    {row("Licences TACTIS", eq.licencesTactis || undefined)}
                    {row("Licences INNO", eq.licencesInno || undefined)}
                    {row("PC Backoffice", eq.pcBackoffice || undefined)}
                    {row("PC Centralisation", eq.pcCentralisation || undefined)}
                  </div>
                  <div className="space-y-1.5">
                    {row("Autres matériels", eq.nbAutresMateriels || undefined)}
                    {row("Borne Allergène", eq.borneAllergene || undefined)}
                    {row("Borne de commande", eq.borneCommande || undefined)}
                    {row(
                      "Étiquettes électroniques",
                      eq.etiquettesElectronique || undefined,
                    )}
                    {row("Carte fidélité", eq.carteFidelite || undefined)}
                  </div>
                </div>
              </div>

              {/* Remarques */}
              {clientFile.remarques && (
                <div className="space-y-1.5">
                  <p className={sec}>Remarques</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {clientFile.remarques}
                  </p>
                </div>
              )}
            </div>

            {/* ── Right panel : Google Maps (30%) ── */}
            <div className="flex flex-col">
              <p className={sec}>Localisation</p>
              {clientFile.adresse || clientFile.cp || clientFile.ville ? (
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    [clientFile.adresse, clientFile.cp, clientFile.ville]
                      .filter(Boolean)
                      .join(", "),
                  )}&output=embed&hl=fr`}
                  className="flex-1 min-h-[320px] w-full rounded-lg border-0"
                  loading="lazy"
                  title="Localisation client"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex-1 min-h-[320px] rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                  <p className="text-xs text-gray-400 italic text-center px-4">
                    Aucune adresse renseignée
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB : DOCUMENTS
      ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "documents" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <FileText size={15} className="text-brand-500" />
              Documents
            </p>
            <button
              onClick={() => setShowUploadForm((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg px-3 py-1.5 transition-colors"
            >
              <UploadCloud size={13} />
              Ajouter
            </button>
          </div>

          {showUploadForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.elements.namedItem(
                  "file",
                ) as HTMLInputElement;
                if (input.files?.[0]) handleUploadDoc(input.files[0]);
              }}
              className="flex flex-wrap items-end gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 font-medium">
                  Type
                </label>
                <select
                  value={docType}
                  onChange={(e) =>
                    setDocType(e.target.value as ClientFileDocType)
                  }
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-400"
                >
                  <option value="bdc">Bon de Commande</option>
                  <option value="rapport">Rapport d'intervention</option>
                  <option value="pvrecette">PV de Recette</option>
                  <option value="visite">Visite Préinstallation</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-gray-500 font-medium">
                  Fichier
                </label>
                <input
                  name="file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.xls,.xlsx"
                  required
                  className="text-xs text-gray-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100"
                />
              </div>
              <button
                type="submit"
                disabled={docUploading}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {docUploading ? "Upload…" : "Envoyer"}
              </button>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
              >
                Annuler
              </button>
            </form>
          )}

          {documents.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              Aucun document enregistré
            </p>
          ) : (
            <ul className="divide-y divide-gray-50">
              {documents.map((doc) => {
                const typeLabels: Record<ClientFileDocType, string> = {
                  bdc: "Bon de Commande",
                  rapport: "Rapport d'intervention",
                  pvrecette: "PV de Recette",
                  visite: "Visite Préinstallation",
                  autre: "Autre",
                };
                const fileUrl = `${import.meta.env.VITE_API_URL}uploads/client-files/${doc.filename}`;
                return (
                  <li
                    key={doc._id}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={15} className="text-brand-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {doc.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {typeLabels[doc.type]} · {formatDate(doc.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        title="Télécharger / Ouvrir"
                      >
                        <FileDown size={14} />
                      </a>
                      <button
                        onClick={() => setDeleteDocConfirm(doc._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB : FICHE TECHNIQUE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "technique" &&
        (linkedReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wrench size={40} className="opacity-30 mb-3" />
            <p className="text-sm">Aucune fiche technique</p>
            {isMonteur && (
              <button
                onClick={() => {
                  setEditReport(undefined);
                  setWizardOpen(true);
                }}
                className="mt-4 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium"
              >
                <Plus size={14} /> Créer la fiche technique
              </button>
            )}
          </div>
        ) : (
          <ReportDetailView
            report={linkedReports[0]}
            onEdit={
              isMonteur
                ? () => {
                    dispatch(setSelectedReport(linkedReports[0]));
                    setEditReport(linkedReports[0]);
                    setWizardOpen(true);
                  }
                : undefined
            }
            onDelete={
              isAdmin ? () => setDeleteConfirm(linkedReports[0]._id) : undefined
            }
          />
        ))}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB : ENVOIS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "envois" && (
        <div className="space-y-4">
          {/* KPIs */}
          {linkedShipments.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-2">
                <Package size={14} className="text-blue-500" />
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">Total</p>
                  <p className="text-base font-bold text-gray-900">
                    {linkedShipments.length}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-2">
                <CircleAlert size={14} className="text-red-500" />
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">
                    En attente
                  </p>
                  <p className="text-base font-bold text-red-600">
                    {linkedShipments.filter((s) => !s.sent).length}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-2">
                <Check size={14} className="text-emerald-500" />
                <div>
                  <p className="text-[10px] text-gray-400 font-medium">
                    Envoyés
                  </p>
                  <p className="text-base font-bold text-emerald-600">
                    {linkedShipments.filter((s) => s.sent).length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading */}
          {shipmentsLoading && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Empty */}
          {!shipmentsLoading && linkedShipments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Truck size={24} className="text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">
                Aucun envoi lié
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Liez un envoi depuis la page Envois pour qu'il apparaisse ici.
              </p>
            </div>
          )}

          {/* Table — desktop */}
          {!shipmentsLoading && linkedShipments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left py-3 pl-4 pr-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Pièce
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Société
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Créé par
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-center py-3 pr-4 pl-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {linkedShipments.map((s) => (
                      <tr
                        key={s._id}
                        className={
                          s.sent
                            ? "hover:bg-emerald-50/30 transition-colors opacity-60"
                            : "hover:bg-red-50/30 transition-colors"
                        }
                      >
                        <td className="py-3 pl-4 pr-2">
                          {s.sent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                              <Check size={11} /> Envoyé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <CircleAlert size={11} /> En attente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2 font-medium text-gray-700">
                          {s.piece || "-"}
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-500">
                          {s.societe}
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-400">
                          {s.createdByName || "-"}
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-400">
                          {s.createdAt
                            ? new Date(s.createdAt).toLocaleDateString("fr-FR")
                            : "-"}
                        </td>
                        <td className="py-3 pr-4 pl-2">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDetailShipment(s)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              title="Détail"
                            >
                              <Eye size={13} />
                            </button>
                            {!s.sent && (auth?.isHotline || auth?.isAdmin) && (
                              <button
                                onClick={() => markSentInDossier(s._id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                              >
                                <Send size={11} /> Envoyer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards — mobile */}
              <div className="md:hidden divide-y divide-gray-100">
                {linkedShipments.map((s) => (
                  <div
                    key={s._id}
                    className={`p-4 space-y-2 ${s.sent ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      {s.sent ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <Check size={11} /> Envoyé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <CircleAlert size={11} /> En attente
                        </span>
                      )}
                      <button
                        onClick={() => setDetailShipment(s)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      <Package
                        size={12}
                        className="inline mr-1 text-gray-400"
                      />
                      {s.piece}
                    </div>
                    <div className="text-xs text-gray-500">
                      <Building2
                        size={12}
                        className="inline mr-1 text-gray-400"
                      />
                      {s.societe}
                    </div>
                    <div className="text-xs text-gray-400">
                      Créé par {s.createdByName || "-"}
                      {s.createdAt
                        ? ` · ${new Date(s.createdAt).toLocaleDateString("fr-FR")}`
                        : ""}
                    </div>
                    {!s.sent && (auth?.isHotline || auth?.isAdmin) && (
                      <button
                        onClick={() => markSentInDossier(s._id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                      >
                        <Send size={11} /> Envoyer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipment detail modal */}
          {detailShipment && (
            <Portal>
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                    <h3 className="text-sm font-bold text-gray-800">
                      Détail de l'envoi
                    </h3>
                    <button
                      onClick={() => setDetailShipment(null)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    {(
                      [
                        {
                          label: "Statut",
                          value: detailShipment.sent ? "Envoyé" : "En attente",
                        },
                        { label: "Pièce", value: detailShipment.piece },
                        {
                          label: "Nom",
                          value: `${detailShipment.prenom} ${detailShipment.nom}`,
                        },
                        { label: "Société", value: detailShipment.societe },
                        {
                          label: "Société / Fonction",
                          value: detailShipment.societeOuFonction,
                        },
                        {
                          label: "Adresse",
                          value: `${detailShipment.adresse}, ${detailShipment.codePostal} ${detailShipment.ville}`,
                        },
                        {
                          label: "Téléphone",
                          value: detailShipment.tel || "-",
                        },
                        {
                          label: "Téléphone 2",
                          value: detailShipment.tel2 || "-",
                        },
                        { label: "Email", value: detailShipment.email || "-" },
                        {
                          label: "Envoyé par",
                          value: detailShipment.sentBy || "-",
                        },
                        {
                          label: "Créé par",
                          value: detailShipment.createdByName || "-",
                        },
                        {
                          label: "Date création",
                          value: detailShipment.createdAt
                            ? new Date(detailShipment.createdAt).toLocaleString(
                                "fr-FR",
                              )
                            : "-",
                        },
                      ] as { label: string; value: string }[]
                    ).map((r) => (
                      <div
                        key={r.label}
                        className="flex items-start gap-3 text-sm"
                      >
                        <span className="text-gray-400 font-medium min-w-[140px] shrink-0">
                          {r.label}
                        </span>
                        <span className="text-gray-800 break-all">
                          {r.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 pb-5 pt-2 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => setDetailShipment(null)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </Portal>
          )}
        </div>
      )}

      {/* ── Wizard modal ──────────────────────────────────────────────────────── */}
      {wizardOpen && (
        <ReportWizardModal
          clientFileId={id}
          clientLabel={clientLabel}
          existing={editReport}
          onClose={() => {
            setWizardOpen(false);
            setEditReport(undefined);
            fetchLinkedReports();
          }}
        />
      )}

      {/* ── Delete doc confirm ──────────────────────────────────────────────── */}
      {deleteDocConfirm && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">
                Supprimer ce document ?
              </h3>
              <p className="text-sm text-gray-500">
                Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteDocConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    await handleDeleteDoc(deleteDocConfirm);
                    setDeleteDocConfirm(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ── Delete confirm ──────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">
                Supprimer le rapport ?
              </h3>
              <p className="text-sm text-gray-500">
                Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteReport(deleteConfirm)}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
