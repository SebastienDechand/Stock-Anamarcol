import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import { UidContext } from "../../components/AppContext";
import {
  getAllInterventionReports,
  createInterventionReport,
  updateInterventionReport,
  deleteInterventionReport,
  setSelectedReport,
} from "../../actions/interventionReport.actions";
import { getAllClientFiles } from "../../actions/clientFile.actions";
import Portal from "../../components/Portal";
import {
  Plus,
  X,
  Search,
  Eye,
  Wrench,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";
import type {
  InterventionReport,
  InterventionReportsState,
  ClientFilesState,
  CashguardUnit,
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

// ─── Form Modal ───────────────────────────────────────────────────────────────
function ReportModal({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing?: InterventionReport;
}) {
  const dispatch = useAppDispatch();

  const clientFiles = useSelector(
    (s: { clientFilesReducer: ClientFilesState }) =>
      s.clientFilesReducer.clientFiles,
  );

  const [clientFileId, setClientFileId] = useState<string>(
    existing
      ? typeof existing.clientFile === "string"
        ? existing.clientFile
        : existing.clientFile._id
      : "",
  );
  const [twCaisses, setTwCaisses] = useState<string[]>(() => {
    if (existing?.twCaisses?.length) return existing.twCaisses;
    // backward compat with legacy fixed fields
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
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<number>(0);

  const setUnit = (idx: number, field: keyof CashguardUnit, value: unknown) =>
    setUnits((prev) =>
      prev.map((u, i) => (i === idx ? { ...u, [field]: value } : u)),
    );

  const setK7 = (unitIdx: number, slotIdx: number, val: string) => {
    setUnits((prev) =>
      prev.map((u, i) => {
        if (i !== unitIdx) return u;
        const slots = [...u.k7Slots] as [string, string, string, string];
        slots[slotIdx] = val;
        return { ...u, k7Slots: slots };
      }),
    );
  };

  const addUnit = () => {
    setUnits((prev) => [...prev, emptyUnit()]);
    setExpandedUnit(units.length);
  };

  const removeUnit = (idx: number) =>
    setUnits((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFileId) {
      toast.error("Veuillez sélectionner une fiche client");
      return;
    }
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
        toast.success("Rapport mis à jour");
      } else {
        await dispatch(
          createInterventionReport(payload) as unknown as Parameters<
            typeof dispatch
          >[0],
        );
        toast.success("Rapport créé");
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
            <h3 className="font-semibold text-gray-900">
              {existing
                ? "Modifier le rapport"
                : "Nouveau rapport d'intervention"}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Fiche client */}
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-3">
                Fiche client associée
              </p>
              <select
                className={inputCls}
                value={clientFileId}
                onChange={(e) => setClientFileId(e.target.value)}
                required
              >
                <option value="">-- Sélectionner une fiche client --</option>
                {clientFiles.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.nom.toUpperCase()}
                    {f.prenom ? ` ${f.prenom}` : ""}
                    {f.societe ? ` - ${f.societe}` : ""}
                    {f.cp ? ` (${f.cp})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* TW codes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
                  Codes TW (saisis par le technicien préparateur)
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
                      <label className={labelCls}>TW Caisse {idx + 1}</label>
                      <input
                        className={inputCls}
                        value={tw}
                        onChange={(e) =>
                          setTwCaisses((p) =>
                            p.map((v, i) => (i === idx ? e.target.value : v)),
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
                  onClick={addUnit}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700"
                >
                  <Plus size={13} />
                  Ajouter une unité
                </button>
              </div>

              <div className="space-y-3">
                {units.map((unit, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-xl overflow-hidden"
                  >
                    {/* Unit header */}
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
                              removeUnit(idx);
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

                    {/* Unit body */}
                    {expandedUnit === idx && (
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className={labelCls}>N° de série</label>
                            <input
                              className={inputCls}
                              value={unit.nSerie ?? ""}
                              onChange={(e) =>
                                setUnit(idx, "nSerie", e.target.value)
                              }
                            />
                          </div>
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

                        {/* K7 slots */}
                        <div>
                          <p className={`${labelCls} mb-2`}>
                            Cassettes - 4 slots
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {unit.k7Slots.map((val, slotIdx) => (
                              <div key={slotIdx}>
                                <label className="text-[10px] text-gray-400 mb-0.5 block">
                                  Slot {slotIdx + 1}
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

                        {/* Assigned caisses */}
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

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-brand-600 uppercase tracking-wide block mb-2">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white min-h-[70px] resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Remarques d'intervention…"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {loading
                  ? "Enregistrement…"
                  : existing
                    ? "Mettre à jour"
                    : "Créer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ReportDetailModal({
  report,
  onClose,
  onEdit,
}: {
  report: InterventionReport;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const cf = typeof report.clientFile === "object" ? report.clientFile : null;
  const sec =
    "text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-2 mt-4 first:mt-0";
  const row = (label: string, value?: string | null) =>
    value ? (
      <div className="flex gap-2">
        <span className="text-gray-400 w-36 shrink-0 text-xs">{label}</span>
        <span className="text-gray-800 font-medium text-xs break-all">
          {value}
        </span>
      </div>
    ) : null;

  const formatDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Rapport d'intervention
              </h3>
              {cf && (
                <p className="text-xs text-brand-600 flex items-center gap-1 mt-0.5">
                  <Building2 size={11} />
                  {cf.nom.toUpperCase()}
                  {(cf as { prenom?: string }).prenom
                    ? ` ${(cf as { prenom?: string }).prenom}`
                    : ""}
                  {cf.societe ? ` - ${cf.societe}` : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={12} />
                  Modifier
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-1.5">
            {/* Meta */}
            <p className={sec}>Informations</p>
            {row("Créé le", formatDate(report.createdAt))}
            {row("Par", report.createdBy)}

            {/* TW codes */}
            {(() => {
              const caisses = report.twCaisses?.length
                ? report.twCaisses
                : ([
                    report.twCaisse1,
                    report.twCaisse2,
                    report.twCaisse3,
                  ].filter(Boolean) as string[]);
              const hasTw = caisses.length > 0 || !!report.twPc;
              if (!hasTw) return null;
              return (
                <>
                  <p className={sec}>Codes TW</p>
                  {caisses.map((tw, i) => row(`TW Caisse ${i + 1}`, tw))}
                  {row("TW PC", report.twPc)}
                </>
              );
            })()}

            {/* CashGuard units */}
            {report.cashguardUnits.length > 0 && (
              <>
                <p className={sec}>
                  Unités CashGuard ({report.cashguardUnits.length})
                </p>
                {report.cashguardUnits.map((unit, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5 mb-2"
                  >
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Unité {idx + 1}
                      {unit.nSerie ? ` - N° ${unit.nSerie}` : ""}
                    </p>
                    {row("N° de série", unit.nSerie)}
                    {row("UP", unit.up)}
                    {row("UB", unit.ub)}
                    {unit.k7Slots?.some(Boolean) && (
                      <div className="flex gap-2">
                        <span className="text-gray-400 w-36 shrink-0 text-xs">
                          Cassettes
                        </span>
                        <span className="text-gray-800 font-medium text-xs font-mono">
                          {unit.k7Slots
                            .map((s, i) => `S${i + 1}: ${s || "-"}`)
                            .join("  ")}
                        </span>
                      </div>
                    )}
                    {unit.assignedCaisses?.length > 0 &&
                      row("Caisses assignées", unit.assignedCaisses.join(", "))}
                    {unit.hasPc && (
                      <p className="text-xs text-brand-600 font-medium">
                        PC Backoffice associé
                      </p>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Notes */}
            {report.notes && (
              <>
                <p className={sec}>Notes</p>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                  {report.notes}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RapportsIntervention() {
  const dispatch = useAppDispatch();
  const auth = useContext(UidContext);
  const isMonteur = !!auth?.isMonteur;
  const isAdmin = !!auth?.isAdmin;

  const reports = useSelector(
    (s: { interventionReportsReducer: InterventionReportsState }) =>
      s.interventionReportsReducer.reports,
  );

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<
    InterventionReport | undefined
  >();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [detailTarget, setDetailTarget] = useState<InterventionReport | null>(
    null,
  );

  useEffect(() => {
    dispatch(
      getAllInterventionReports() as unknown as Parameters<typeof dispatch>[0],
    );
    dispatch(getAllClientFiles() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  if (!isMonteur) {
    return <Navigate to="/home" replace />;
  }

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    const cf = typeof r.clientFile === "object" ? r.clientFile : null;
    return (
      (cf?.nom ?? "").toLowerCase().includes(q) ||
      (cf?.societe ?? "").toLowerCase().includes(q) ||
      (cf?.ville ?? "").toLowerCase().includes(q) ||
      (cf?.cp ?? "").includes(q)
    );
  });

  const openCreate = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const openEdit = (report: InterventionReport) => {
    dispatch(setSelectedReport(report));
    setEditTarget(report);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(
        deleteInterventionReport(id) as unknown as Parameters<
          typeof dispatch
        >[0],
      );
      toast.success("Rapport supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const formatDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench size={22} className="text-brand-600" />
            Rapports d'Intervention
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {reports.length} rapport{reports.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isMonteur && (
          <button
            onClick={openCreate}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            Nouveau rapport
          </button>
        )}
      </div>

      {/* Search + mobile add button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher par client, société, ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        {isMonteur && (
          <button
            onClick={openCreate}
            className="sm:hidden shrink-0 flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <Plus size={16} />
            Nouveau rapport
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Wrench size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aucun rapport d'intervention</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((report) => {
            const cf =
              typeof report.clientFile === "object" ? report.clientFile : null;
            return (
              <div
                key={report._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
              >
                {/* Title */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {cf ? (
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                        {cf.nom.toUpperCase()}
                        {(cf as { prenom?: string }).prenom
                          ? ` ${(cf as { prenom?: string }).prenom}`
                          : ""}
                      </h3>
                    ) : (
                      <h3 className="font-semibold text-gray-500 text-sm">
                        Fiche client inconnue
                      </h3>
                    )}
                    {cf?.societe && (
                      <p className="text-xs text-brand-600 mt-0.5 flex items-center gap-1">
                        <Building2 size={11} />
                        {cf.societe}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {formatDate(report.createdAt)}
                  </span>
                </div>

                {/* TW summary */}
                <div className="space-y-0.5">
                  {(report.twCaisses?.length
                    ? report.twCaisses
                    : ([
                        report.twCaisse1,
                        report.twCaisse2,
                        report.twCaisse3,
                      ].filter(Boolean) as string[])
                  ).map((tw, i) => (
                    <p key={i} className="text-xs text-gray-500 font-mono">
                      <span className="text-gray-400 mr-1">TW C{i + 1}:</span>
                      {tw}
                    </p>
                  ))}
                  {report.twPc && (
                    <p className="text-xs text-gray-500 font-mono">
                      <span className="text-gray-400 mr-1">TW PC:</span>
                      {report.twPc}
                    </p>
                  )}
                </div>

                {/* Units count */}
                {report.cashguardUnits.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {report.cashguardUnits.length} unité
                    {report.cashguardUnits.length > 1 ? "s" : ""} CashGuard
                  </p>
                )}

                {/* By */}
                {report.createdBy && (
                  <p className="text-xs text-gray-400">
                    Par {report.createdBy}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <button
                    onClick={() => setDetailTarget(report)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 transition-colors"
                  >
                    <Eye size={13} />
                    Voir le détail
                  </button>
                  {isMonteur && (
                    <button
                      onClick={() => openEdit(report)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 transition-colors ml-auto"
                    >
                      <Pencil size={13} />
                      Modifier
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteConfirm(report._id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detailTarget && (
        <ReportDetailModal
          report={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEdit={
            isMonteur
              ? () => {
                  openEdit(detailTarget);
                  setDetailTarget(null);
                }
              : undefined
          }
        />
      )}

      {/* Modal */}
      {modalOpen && (
        <ReportModal
          onClose={() => {
            setModalOpen(false);
            setEditTarget(undefined);
          }}
          existing={editTarget}
        />
      )}

      {/* Delete confirm */}
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
                  onClick={() => handleDelete(deleteConfirm)}
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
