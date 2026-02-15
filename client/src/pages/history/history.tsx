import { useEffect, useState, useContext, useRef } from "react";
import axios from "axios";
import { UidContext } from "../../components/AppContext";
import { Clock, ChevronDown, X } from "lucide-react";
import { ACTION_MAP, DEFAULT_ACTION, ENTITY_MAP } from "../../constants";
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

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center gap-2">
        <Clock size={20} className="text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900">Historique</h1>
        <span className="text-xs text-gray-400 ml-2">
          {filtered.length} événements
        </span>
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
    </div>
  );
}
