import { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { UidContext } from "../../components/AppContext";
import AccessDenied from "../../components/AccessDenied/AccessDenied";
import { useAppDispatch } from "../../hooks/redux";
import { getAllClientFiles } from "../../actions/clientFile.actions";
import type { ClientFilesState } from "../../types";
import {
  Plus,
  Check,
  Trash2,
  Truck,
  Clock,
  MapPin,
  Package,
  User,
  Send,
  CircleAlert,
  X,
  Download,
  History,
  ClipboardPaste,
  Link,
  FolderOpen,
  Building2,
  Phone,
  Mail,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import ExportOptionsModal from "../../components/Modales/ExportOptionsModal";
import type { ExportFormat } from "../../types/shipment";
import ShipmentHistoryModal from "../../components/Modales/ShipmentHistoryModal";
import Portal from "../../components/Portal";
import type { Shipment, ShipmentForm } from "../../types/shipment";

const emptyForm: ShipmentForm = {
  nom: "",
  prenom: "",
  tel: "",
  tel2: "",
  email: "",
  adresse: "",
  codePostal: "",
  ville: "",
  societeOuFonction: "",
  societe: "",
  piece: "",
  requestDate: "",
};

const FIELD_MAP: Record<string, keyof ShipmentForm> = {
  nom: "nom",
  prenom: "prenom",
  prénom: "prenom",
  telephone: "tel",
  téléphone: "tel",
  tel: "tel",
  telephone2: "tel2",
  téléphone2: "tel2",
  tel2: "tel2",
  email: "email",
  "e-mail": "email",
  adresse: "adresse",
  "code postal": "codePostal",
  cp: "codePostal",
  ville: "ville",
  "societe ou fonction": "societeOuFonction",
  "société ou fonction": "societeOuFonction",
  societe: "societe",
  société: "societe",
};

function parsePastedText(text: string): Partial<ShipmentForm> {
  const result: Partial<ShipmentForm> = {};
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const rawKey = line
      .substring(0, idx)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    const value = line.substring(idx + 1).trim();
    const field = FIELD_MAP[rawKey];
    if (field) result[field] = value;
  }
  return result;
}

/* ── Component ───────────────────────────────────────── */
export default function EnvoisPage() {
  const auth = useContext(UidContext);
  const dispatch = useAppDispatch();
  const clientFiles = useSelector(
    (s: { clientFilesReducer: ClientFilesState }) =>
      s.clientFilesReducer.clientFiles,
  );
  const [linkedClientFileId, setLinkedClientFileId] = useState("");
  const [clientFileSearch, setClientFileSearch] = useState("");
  const [showCfSuggestions, setShowCfSuggestions] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ShipmentForm>({ ...emptyForm });
  const [pasteText, setPasteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [detailShipment, setDetailShipment] = useState<Shipment | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "sent">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const canEdit = auth?.isHotline || auth?.isAdmin;

  useEffect(() => {
    dispatch(getAllClientFiles() as unknown as Parameters<typeof dispatch>[0]);
  }, [dispatch]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}api/shipments`, {
        withCredentials: true,
      })
      .then((res) => setShipments(res.data))
      .catch((err) => console.error(err));
  }, [auth]);

  if (!auth?.isHotline) {
    return (
      <AccessDenied
        title="Accès hotline requis"
        message="Cette page est réservée aux hotlines."
      />
    );
  }

  const pending = shipments.filter((s) => !s.sent);
  const sent = shipments.filter((s) => s.sent);

  const filtered = shipments.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      [
        s.nom,
        s.prenom,
        s.societe,
        s.societeOuFonction,
        s.piece,
        s.ville,
        s.codePostal,
        s.tel || "",
        s.email || "",
      ].some((v) => v.toLowerCase().includes(q));
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !s.sent) ||
      (statusFilter === "sent" && s.sent);
    return matchSearch && matchStatus;
  });

  const totalPageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const setField = (key: keyof ShipmentForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleParse = () => {
    if (!pasteText.trim()) return;
    const parsed = parsePastedText(pasteText);
    setForm((prev) => ({ ...prev, ...parsed }));
    setPasteText("");
    toast.success("Champs remplis depuis le texte collé");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const required: { key: keyof ShipmentForm; label: string }[] = [
      { key: "nom", label: "Nom" },
      { key: "prenom", label: "Prénom" },
      { key: "adresse", label: "Adresse" },
      { key: "codePostal", label: "Code postal" },
      { key: "ville", label: "Ville" },
      { key: "societeOuFonction", label: "Société ou Fonction" },
      { key: "societe", label: "Société" },
      { key: "piece", label: "Pièce" },
    ];
    const missing = required.filter((r) => !form[r.key].trim());
    if (missing.length > 0) {
      toast.error(`Champs requis : ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (form.requestDate)
        payload.requestDate = new Date(form.requestDate).toISOString();
      else payload.requestDate = new Date().toISOString();
      // Remove empty optional fields
      if (!payload.tel) delete payload.tel;
      if (!payload.tel2) delete payload.tel2;
      if (!payload.email) delete payload.email;
      if (linkedClientFileId) payload.clientFile = linkedClientFileId;

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}api/shipments`,
        payload,
        { withCredentials: true },
      );
      setShipments((s) => [res.data, ...s]);
      setForm({ ...emptyForm });
      setLinkedClientFileId("");
      setClientFileSearch("");
      setShowForm(false);
      toast.success("Envoi ajouté");
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message || "Impossible d'ajouter l'envoi";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const markSent = async (id: string) => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}api/shipments/${id}/sent`,
        {},
        { withCredentials: true },
      );
      setShipments((s) => s.map((sh) => (sh._id === id ? res.data : sh)));
      toast.success("Marqué comme envoyé");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de marquer comme envoyé");
    }
  };

  /* ── Export handler for the modal ──────────────── */
  const handleExportEnvois = async (format: ExportFormat) => {
    const rows = shipments.map((s) => ({
      Statut: s.sent ? "Envoyé" : "En attente",
      Nom: s.nom,
      Prénom: s.prenom,
      Société: s.societe,
      "Société / Fonction": s.societeOuFonction,
      Pièce: s.piece,
      Adresse: s.adresse,
      CP: s.codePostal,
      Ville: s.ville,
      Tél: s.tel || "",
      "Tél 2": s.tel2 || "",
      Email: s.email || "",
      "Envoyé par": s.sentBy || "",
      "Créé par": s.createdByName || "",
      "Date création": s.createdAt
        ? new Date(s.createdAt).toLocaleString("fr-FR")
        : "",
    }));

    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === "xlsx") {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Envois");
      XLSX.writeFile(wb, `envois_${dateStr}.xlsx`);
    } else if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(16);
      doc.text("Liste des envois", 14, 18);
      doc.setFontSize(9);
      doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")}`, 14, 24);
      const cols = Object.keys(rows[0] || {});
      // jspdf-autotable augments jsPDF prototype at runtime
      (
        doc as unknown as { autoTable: (opts: Record<string, unknown>) => void }
      ).autoTable({
        startY: 28,
        head: [cols],
        body: rows.map((r) =>
          cols.map((c) => (r as Record<string, string>)[c]),
        ),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [107, 138, 71] },
      });
      doc.save(`envois_${dateStr}.pdf`);
    }
  };

  const refreshShipments = async () => {
    try {
      const resp = await axios.get(
        `${import.meta.env.VITE_API_URL}api/shipments`,
        { withCredentials: true },
      );
      setShipments(resp.data);
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}api/shipments/${id}`, {
        withCredentials: true,
      });
      setShipments((s) => s.filter((sh) => sh._id !== id));
      toast.success("Supprimé");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de supprimer");
    }
  };

  /* ── Render helper for a single form field ──────── */
  const renderField = (
    key: keyof ShipmentForm,
    label: string,
    opts?: {
      required?: boolean;
      type?: string;
      icon?: typeof User;
      placeholder?: string;
    },
  ) => {
    const Icon = opts?.icon;
    return (
      <div key={key}>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {label}
          {opts?.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <div className="relative">
          {Icon && (
            <Icon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          )}
          <input
            value={form[key]}
            onChange={(e) => setField(key, e.target.value)}
            type={opts?.type || "text"}
            placeholder={opts?.placeholder}
            className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all`}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Truck size={20} className="text-brand-600 shrink-0" />
            Envois
          </h1>
          <p className="text-sm text-gray-600 mt-1">Suivi des expéditions et livraisons</p>
        </div>
        <div className="flex items-center gap-2">
          {auth?.isAdmin && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors shadow-sm"
            >
              <Download size={16} />
            </button>
          )}
          {auth?.isAdmin && (
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors shadow-sm"
            >
              <History size={16} />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? "Fermer" : "Nouvel envoi"}
            </button>
          )}
        </div>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
            <Package size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium leading-tight">
              Total
            </p>
            <p className="text-lg font-bold text-gray-900">
              {shipments.length}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-50 flex items-center justify-center">
            <CircleAlert size={16} className="text-red-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium leading-tight">
              En attente
            </p>
            <p className="text-lg font-bold text-red-600">{pending.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center">
            <Check size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 font-medium leading-tight">
              Envoyés
            </p>
            <p className="text-lg font-bold text-emerald-600">{sent.length}</p>
          </div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Rechercher par nom, société, pièce, ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(["all", "pending", "sent"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {st === "all"
                ? "Tous"
                : st === "pending"
                  ? "En attente"
                  : "Envoyés"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Creation form ── */}
      {showForm && canEdit && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-in slide-in-from-top-2 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Nouvel envoi</h2>

          {/* Lier à une fiche client — combobox */}
          {clientFiles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Link size={13} />
                Lier à une fiche client (optionnel)
              </label>
              {linkedClientFileId ? (
                (() => {
                  const cf = clientFiles.find(
                    (f) => f._id === linkedClientFileId,
                  );
                  return (
                    <div className="flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg">
                      <FolderOpen
                        size={13}
                        className="text-brand-600 shrink-0"
                      />
                      <span className="text-sm text-brand-700 font-medium flex-1 truncate">
                        {cf
                          ? `${cf.nom.toUpperCase()}${cf.prenom ? ` ${cf.prenom}` : ""}${cf.societe ? ` - ${cf.societe}` : ""}`
                          : "Fiche liée"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkedClientFileId("");
                          setClientFileSearch("");
                        }}
                        className="text-brand-400 hover:text-brand-700 shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={clientFileSearch}
                    placeholder="Rechercher une fiche client…"
                    onChange={(e) => {
                      setClientFileSearch(e.target.value);
                      setShowCfSuggestions(true);
                    }}
                    onFocus={() => setShowCfSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowCfSuggestions(false), 150)
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  />
                  {showCfSuggestions && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {clientFiles
                        .filter((f) => {
                          const q = clientFileSearch.toLowerCase();
                          if (!q) return true;
                          return (
                            f.nom.toLowerCase().includes(q) ||
                            (f.prenom ?? "").toLowerCase().includes(q) ||
                            (f.societe ?? "").toLowerCase().includes(q) ||
                            (f.ville ?? "").toLowerCase().includes(q) ||
                            (f.cp ?? "").includes(q)
                          );
                        })
                        .slice(0, 8)
                        .map((f) => (
                          <button
                            key={f._id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setLinkedClientFileId(f._id);
                              setClientFileSearch("");
                              setShowCfSuggestions(false);
                              setForm((prev) => ({
                                ...prev,
                                nom: f.nom,
                                prenom: f.prenom ?? "",
                                tel: f.tel ?? f.mobile ?? "",
                                email: f.email ?? "",
                                adresse: f.adresse ?? "",
                                codePostal: f.cp ?? "",
                                ville: f.ville ?? "",
                                societe: f.societe ?? "",
                                societeOuFonction: f.societe ?? "",
                              }));
                            }}
                            className="w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-brand-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <FolderOpen
                              size={13}
                              className="text-brand-400 shrink-0 mt-0.5"
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                {f.nom.toUpperCase()}
                                {f.prenom ? ` ${f.prenom}` : ""}
                              </p>
                              {f.societe && (
                                <p className="text-xs text-gray-400">
                                  {f.societe}
                                </p>
                              )}
                              {(f.cp || f.ville) && (
                                <p className="text-xs text-gray-400">
                                  {[f.cp, f.ville].filter(Boolean).join(" ")}
                                </p>
                              )}
                            </div>
                          </button>
                        ))}
                      {clientFiles.filter((f) => {
                        const q = clientFileSearch.toLowerCase();
                        return (
                          !q ||
                          f.nom.toLowerCase().includes(q) ||
                          (f.prenom ?? "").toLowerCase().includes(q) ||
                          (f.societe ?? "").toLowerCase().includes(q)
                        );
                      }).length === 0 && (
                        <p className="px-4 py-3 text-xs text-gray-400 text-center">
                          Aucun résultat
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <ClipboardPaste size={13} />
              Coller la fiche client (optionnel)
            </label>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`Collez le bloc complet :\nNOM : DUPONT\nPRENOM : JEAN\nTELEPHONE : 06 …\nADRESSE : …\nCODE POSTAL : …\nVILLE : …\nSOCIETE OU FONCTION : …\nSociété : …`}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y min-h-[90px] focus:ring-2 focus:ring-brand-500 focus:border-transparent font-mono"
              rows={5}
            />
            <button
              type="button"
              onClick={handleParse}
              disabled={!pasteText.trim()}
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors flex items-center gap-1"
            >
              <ClipboardPaste size={13} />
              Parser et remplir les champs
            </button>
          </div>

          <hr className="border-gray-100" />

          {/* Manual fields – explicit row groupings */}
          <form onSubmit={handleCreate} className="space-y-3">
            {/* Row: Last name / First name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderField("nom", "Nom", {
                required: true,
                icon: User,
                placeholder: "ex : MARTIN",
              })}
              {renderField("prenom", "Prénom", {
                required: true,
                icon: User,
                placeholder: "ex : Sophie",
              })}
            </div>

            {/* Row: Phone / Phone 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderField("tel", "Téléphone", {
                icon: Phone,
                placeholder: "ex : 06 12 34 56 78",
              })}
              {renderField("tel2", "Téléphone 2", {
                icon: Phone,
                placeholder: "ex : 01 23 45 67 89",
              })}
            </div>

            {/* Row: Adresse / Code postal / Ville */}
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-3">
              {renderField("adresse", "Adresse", {
                required: true,
                icon: MapPin,
                placeholder: "ex : 7 avenue Mozart",
              })}
              {renderField("codePostal", "Code postal", {
                required: true,
                placeholder: "ex : 75016",
              })}
              {renderField("ville", "Ville", {
                required: true,
                placeholder: "ex : Paris",
              })}
            </div>

            {/* Row: Company / Company or Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderField("societe", "Société", {
                required: true,
                icon: Building2,
                placeholder: "ex : Boulangerie Raybaud",
              })}
              {renderField("societeOuFonction", "Société ou Fonction", {
                required: true,
                icon: Building2,
                placeholder: "ex : Raison sociale ou fonction du contact",
              })}
            </div>

            {/* Row: Email / Request date / Document */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {renderField("email", "Email", {
                icon: Mail,
                placeholder: "ex : contact@boutique.fr",
              })}
              {renderField("requestDate", "Date demande", {
                type: "datetime-local",
                icon: Clock,
              })}
              {renderField("piece", "Pièce à envoyer", {
                required: true,
                icon: Package,
                placeholder: "ex : Hooper, rouleau TPE, clavier...",
              })}
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setForm({ ...emptyForm });
                }}
                className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors mr-2"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <Plus size={15} /> Ajouter l'envoi
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── No results ── */}
      {shipments.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
            <Search size={24} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">Aucun résultat</p>
          <p className="text-xs text-gray-400 mt-1">
            Modifiez votre recherche ou filtre
          </p>
        </div>
      )}

      {/* ── Shipments table ── */}
      {filtered.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3 pl-4 pr-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Société
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Pièce
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Créé par
                  </th>
                  <th className="text-center py-3 pr-4 pl-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((s) => (
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
                          <Check size={12} />
                          Envoyé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          <CircleAlert size={12} />
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div
                        className={`font-semibold ${s.sent ? "text-gray-600" : "text-gray-900"}`}
                      >
                        {s.prenom} {s.nom}
                      </div>
                    </td>
                    <td
                      className={`py-3 px-2 text-xs ${s.sent ? "text-gray-400" : "text-gray-600"}`}
                    >
                      {s.societe}
                    </td>
                    <td
                      className={`py-3 px-2 font-medium ${s.sent ? "text-gray-400" : "text-gray-700"}`}
                    >
                      {s.piece || "-"}
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">
                      {s.createdByName}
                    </td>
                    <td className="py-3 pr-4 pl-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailShipment(s)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Voir le détail"
                        >
                          <Eye size={14} />
                        </button>
                        {!s.sent && canEdit && (
                          <button
                            onClick={() => markSent(s._id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                            title="Marquer comme envoyé"
                          >
                            <Send size={12} />
                            Envoyer
                          </button>
                        )}
                        {auth?.isAdmin && (
                          <button
                            onClick={() => setDeleteConfirm(s._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {paginated.map((s) => (
              <div
                key={s._id}
                className={`p-4 space-y-2 ${s.sent ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between">
                  {s.sent ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                      <Check size={12} />
                      Envoyé
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      <CircleAlert size={12} />
                      En attente
                    </span>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailShipment(s)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      title="Voir le détail"
                    >
                      <Eye size={14} />
                    </button>
                    <span className="text-xs text-gray-400">
                      {s.createdByName}
                    </span>
                  </div>
                </div>
                <div className="font-semibold text-gray-900">
                  {s.prenom} {s.nom}
                </div>
                <div className="text-xs text-gray-500">
                  <Building2 size={12} className="inline mr-1 text-gray-400" />
                  {s.societe} · {s.societeOuFonction}
                </div>
                <div className="text-sm text-gray-700 font-medium">
                  <Package size={12} className="inline mr-1 text-gray-400" />
                  {s.piece}
                </div>
                {s.adresse && (
                  <div className="text-sm text-gray-600">
                    <MapPin size={12} className="inline mr-1 text-gray-400" />
                    {s.adresse}, {s.codePostal} {s.ville}
                  </div>
                )}
                {s.tel && (
                  <div className="text-xs text-gray-500">
                    <Phone size={12} className="inline mr-1 text-gray-400" />
                    {s.tel}
                    {s.tel2 && ` / ${s.tel2}`}
                  </div>
                )}
                {s.email && (
                  <div className="text-xs text-gray-500">
                    <Mail size={12} className="inline mr-1 text-gray-400" />
                    {s.email}
                  </div>
                )}
                {s.sentBy && (
                  <div className="text-xs text-gray-500">
                    <Send size={12} className="inline mr-1 text-gray-400" />
                    Envoyé par {s.sentBy}
                  </div>
                )}
                {(!s.sent || auth?.isAdmin) && canEdit && (
                  <div className="flex items-center gap-2 pt-1">
                    {!s.sent && canEdit && (
                      <button
                        onClick={() => markSent(s._id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                        title="Marquer comme envoyé"
                      >
                        <Send size={12} />
                        Envoyer
                      </button>
                    )}
                    {auth?.isAdmin && (
                      <button
                        onClick={() => setDeleteConfirm(s._id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && totalPageCount > 1 && (
        <div className="flex items-center justify-center gap-3 py-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} / {totalPageCount}
          </span>
          <button
            onClick={() =>
              setCurrentPage((p) => Math.min(totalPageCount, p + 1))
            }
            disabled={currentPage === totalPageCount}
            className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {shipments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Truck size={28} className="text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            Aucun envoi pour le moment
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Cliquez sur « Nouvel envoi » pour commencer
          </p>
        </div>
      )}

      {/* Export modal */}
      {isExportModalOpen && (
        <ExportOptionsModal
          title="Exporter les envois"
          formats={["pdf", "xlsx"]}
          onExport={handleExportEnvois}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {/* History modal */}
      {isHistoryOpen && (
        <ShipmentHistoryModal
          onClose={() => setIsHistoryOpen(false)}
          onArchived={refreshShipments}
        />
      )}

      {/* Confirmation suppression */}
      {deleteConfirm && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
              <p className="text-sm font-semibold text-gray-800 mb-1">
                Supprimer cet envoi ?
              </p>
              <p className="text-xs text-gray-500 mb-5">
                Cette action est irréversible.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    await remove(deleteConfirm);
                    setDeleteConfirm(null);
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

      {/* Detail modal */}
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
                {(() => {
                  const s = detailShipment;
                  const rows: { label: string; value: string }[] = [
                    {
                      label: "Statut",
                      value: s.sent ? "Envoyé" : "En attente",
                    },
                    { label: "Nom", value: s.nom },
                    { label: "Prénom", value: s.prenom },
                    { label: "Société", value: s.societe },
                    { label: "Société / Fonction", value: s.societeOuFonction },
                    { label: "Pièce", value: s.piece },
                    { label: "Adresse", value: s.adresse },
                    { label: "Code postal", value: s.codePostal },
                    { label: "Ville", value: s.ville },
                    { label: "Téléphone", value: s.tel || "-" },
                    { label: "Téléphone 2", value: s.tel2 || "-" },
                    { label: "Email", value: s.email || "-" },
                    { label: "Envoyé par", value: s.sentBy || "-" },
                    { label: "Créé par", value: s.createdByName || "-" },
                    {
                      label: "Date création",
                      value: s.createdAt
                        ? new Date(s.createdAt).toLocaleString("fr-FR")
                        : "-",
                    },
                  ];
                  return rows.map((r) => (
                    <div
                      key={r.label}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="text-gray-400 font-medium min-w-[130px] shrink-0">
                        {r.label}
                      </span>
                      <span className="text-gray-800 break-all">{r.value}</span>
                    </div>
                  ));
                })()}
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
  );
}
