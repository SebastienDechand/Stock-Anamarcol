import { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { UidContext } from "../../components/AppContext";
import { Clock, ChevronDown, X, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { ACTION_MAP, DEFAULT_ACTION, ENTITY_MAP } from "../../constants";
import Portal from "../../components/Portal";
import type { AuditEvent, User } from "../../types";

function formatDate(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function entityLabel(e: AuditEvent): string {
  const name = e.details?.entityName || e.details?.denomination;
  return name ? ` "${name}"` : "";
}

function describeEvent(e: AuditEvent): string {
  const entity = ENTITY_MAP[e.entity]?.label?.toLowerCase() || e.entity;

  if (e.action === "login") return "s'est connecté(e)";
  if (e.action === "create") return `a ajouté ${entity}${entityLabel(e)}`;
  if (e.action === "delete") {
    const name =
      e.details?.entityName || e.details?.oldValue || e.details?.denomination;
    return name ? `a supprimé ${entity} "${name}"` : `a supprimé un ${entity}`;
  }
  if (e.action === "upload") return `a uploadé une photo${entityLabel(e)}`;
  if (e.action === "move") return `a déplacé un article${entityLabel(e)}`;
  if (e.action === "quantity_change" && e.details) {
    return `a changé la quantité${entityLabel(e)} (${e.details.oldValue} → ${e.details.newValue})`;
  }

  if (e.action === "update" && e.details?.changes) {
    const fields = Object.keys(e.details.changes as Record<string, unknown>);
    return `a modifié ${entity}${entityLabel(e)} (${fields.join(", ")})`;
  }
  if (e.action === "update" && e.details?.field) {
    return `a modifié ${String(e.details.field)}${entityLabel(e)}`;
  }

  return `a effectué "${e.action}" sur ${entity}`;
}

export default function HistoryPage() {
  const auth = useContext(UidContext);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [users, setUsers] = useState<{ _id: string; pseudo: string }[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth?.isAdmin) return;
    axios
      .get(`${import.meta.env.VITE_API_URL}api/history/`, {
        withCredentials: true,
      })
      .then((res) => setEvents(res.data))
      .catch((err) => console.error(err));
    axios
      .get(`${import.meta.env.VITE_API_URL}api/user/`, {
        withCredentials: true,
      })
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err));
  }, [auth]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!auth?.isAdmin) return null;

  // Events avec un userName connu uniquement
  const knownEvents = events.filter((e) => e.userName);

  // Exclure les événements de type 'update' qui ne modifient que la quantité
  const cleanedEvents = knownEvents.filter((e) => {
    if (e.action !== "update") return true;
    // cas où la modification est décrite avec un champ unique
    if (e.details?.field) {
      const f = String(e.details.field).toLowerCase();
      if (f === "quantity" || f === "quantite") return false;
    }
    // cas où la modification contient un objet 'changes'
    if (e.details?.changes && typeof e.details.changes === "object") {
      const fields = Object.keys(e.details.changes as Record<string, unknown>);
      if (
        fields.length > 0 &&
        fields.every((k) => {
          const key = String(k).toLowerCase();
          return key === "quantity" || key === "quantite";
        })
      ) {
        return false;
      }
    }
    return true;
  });

  // Actions disponibles pour le filtre (après nettoyage)
  const availableActions = [...new Set(cleanedEvents.map((e) => e.action))];

  // Appliquer les filtres
  const filtered = cleanedEvents.filter((e) => {
    if (activeFilter !== "all" && e.action !== activeFilter) return false;
    if (selectedUsers.length > 0 && !selectedUsers.includes(e.userName || ""))
      return false;
    return true;
  });

  const toggleUser = (pseudo: string) => {
    setSelectedUsers((prev) =>
      prev.includes(pseudo)
        ? prev.filter((u) => u !== pseudo)
        : [...prev, pseudo],
    );
  };

  const handlePurge = async () => {
    setIsPurging(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}api/history/purge`,
        {},
        { withCredentials: true },
      );
      setEvents([]);
      toast.success("Historique et audit purgés");
    } catch (err) {
      console.error(err);
      toast.error("Impossible de purger l'historique");
    } finally {
      setIsPurging(false);
      setShowPurgeModal(false);
    }
  };

  return (
    <div className="space-y-4 h-full">
      <div className="flex flex-wrap items-center gap-2">
        <Clock size={20} className="text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900">Historique</h1>
        <span className="text-xs text-gray-400 ml-2">
          {filtered.length} événements
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
          <span className="text-xs text-gray-400">
            Historique depuis le{" "}
            {new Date(Date.now() - 30 * 24 * 3600 * 1000).toLocaleDateString(
              "fr-FR",
              { day: "numeric", month: "long", year: "numeric" },
            )}
          </span>
          {auth?.isSuperadmin && (
            <button
              onClick={() => setShowPurgeModal(true)}
              disabled={isPurging}
              className="ml-auto sm:ml-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              title="Purger audit + history"
            >
              <Trash2 size={14} />
              Purger
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
            activeFilter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tout
        </button>
        {availableActions.map((action) => {
          const info = ACTION_MAP[action];
          if (!info) return null;
          return (
            <button
              key={action}
              onClick={() => setActiveFilter(action)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                activeFilter === action
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {info.label}
            </button>
          );
        })}

        {users.length > 0 && (
          <>
            <span className="w-px h-5 bg-gray-300 mx-1" />
            <div className="relative flex items-center gap-1" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                  selectedUsers.length > 0
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {selectedUsers.length > 0
                  ? `${selectedUsers.length} utilisateur${selectedUsers.length > 1 ? "s" : ""}`
                  : "Utilisateurs"}
                <ChevronDown size={12} />
              </button>
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => setSelectedUsers([])}
                  className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                  title="Effacer le filtre"
                >
                  <X size={12} />
                </button>
              )}
              {userDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg ring-1 ring-black/10 py-1 z-50 min-w-[180px] max-h-60 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u._id}
                      onClick={() => toggleUser(u.pseudo)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50 transition-colors"
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          selectedUsers.includes(u.pseudo)
                            ? "bg-brand-600 border-brand-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedUsers.includes(u.pseudo) && (
                          <svg
                            width="8"
                            height="8"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5L4.5 7.5L8 2.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span className="text-gray-700">{u.pseudo}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {filtered.map((e) => {
          const actionInfo = ACTION_MAP[e.action] || DEFAULT_ACTION;
          const ActionIcon = actionInfo.icon;

          return (
            <div
              key={e._id}
              className="bg-white rounded-lg px-4 py-3 shadow-sm ring-1 ring-black/[0.04] flex items-center gap-3"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${actionInfo.color}`}
              >
                <ActionIcon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{e.userName}</span>{" "}
                  <span className="text-gray-600">{describeEvent(e)}</span>
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {formatDate(e.createdAt)}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            Aucun événement
          </p>
        )}
      </div>

      {/* Modale de confirmation purge */}
      {showPurgeModal && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => !isPurging && setShowPurgeModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 pt-6 pb-4 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Purger l'historique
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Cette action supprimera{" "}
                  <span className="font-medium text-gray-700">
                    définitivement
                  </span>{" "}
                  tous les logs d'audit et l'historique des modifications.
                </p>
                <p className="mt-1 text-xs text-red-500 font-medium">
                  Cette action est irréversible.
                </p>
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={() => setShowPurgeModal(false)}
                  disabled={isPurging}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handlePurge}
                  disabled={isPurging}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  {isPurging ? "Purge en cours…" : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
