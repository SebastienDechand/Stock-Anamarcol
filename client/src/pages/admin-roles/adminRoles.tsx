import { useContext, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { ShieldCheck, Search, Loader2 } from "lucide-react";
import { UidContext } from "../../components/AppContext";
import AccessDenied from "../../components/AccessDenied/AccessDenied";
import { Role } from "../../constants";
import type { User } from "../../types";

// ─── Role column config ───────────────────────────────────────────────────────
const ROLE_COLUMNS: { role: Role; label: string; cls: string }[] = [
  { role: Role.USER, label: "User", cls: "bg-gray-100 text-gray-600" },
  { role: Role.HOTLINE, label: "Hotline", cls: "bg-sky-100 text-sky-700" },
  { role: Role.MONTEUR, label: "Monteur", cls: "bg-amber-100 text-amber-700" },
  { role: Role.ADMIN, label: "Admin", cls: "bg-violet-100 text-violet-700" },
  {
    role: Role.SUPERADMIN,
    label: "Super Admin",
    cls: "bg-red-100 text-red-700",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminRoles() {
  const auth = useContext(UidContext);
  const users = useSelector(
    (state: { usersReducer: User[] }) => state.usersReducer,
  );

  // Map of userId → current selected roles (initialised from store)
  const [rolesMap, setRolesMap] = useState<Record<string, Role[]>>(() =>
    Object.fromEntries(
      users.map((u) => {
        const roles = u.roles && u.roles.length > 0 ? u.roles : [Role.USER];
        // Ensure USER is always present
        return [
          u._id,
          roles.includes(Role.USER) ? roles : [Role.USER, ...roles],
        ];
      }),
    ),
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  if (!auth?.isSuperadmin) {
    return (
      <AccessDenied
        title="Accès administrateur requis"
        message="Cette page est réservée aux super administrateurs."
      />
    );
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.pseudo.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  const toggleRole = async (user: User, role: Role) => {
    // USER role is permanent - cannot be removed
    if (role === Role.USER) return;
    const current = rolesMap[user._id] ?? [];
    const next = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    // Always include USER
    const safeNext = next.includes(Role.USER) ? next : [Role.USER, ...next];
    setRolesMap((prev) => ({ ...prev, [user._id]: safeNext }));
    setSaving((s) => ({ ...s, [user._id]: true }));
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}api/user/${user._id}/roles`,
        { roles: safeNext },
        { withCredentials: true },
      );
      toast.success(`Rôles mis à jour pour ${user.pseudo}`);
    } catch {
      // Rollback on error
      setRolesMap((prev) => ({ ...prev, [user._id]: current }));
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving((s) => ({ ...s, [user._id]: false }));
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck size={20} className="text-brand-600 shrink-0" />
            Gestion des rôles
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {users.length} membre{users.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un membre…"
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Table - desktop */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 pl-4 pr-2 font-medium text-gray-500 text-xs uppercase tracking-wider">
                  Membre
                </th>
                {ROLE_COLUMNS.map(({ role, label }) => (
                  <th
                    key={role}
                    className="text-center py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => {
                const currentRoles = rolesMap[user._id] ?? [Role.USER];
                return (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* User info */}
                    <td className="py-3 pl-4 pr-2">
                      <div className="flex items-center">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-gray-900 truncate">
                              {user.pseudo}
                            </p>
                            {saving[user._id] && (
                              <Loader2
                                size={12}
                                className="animate-spin text-brand-500 shrink-0"
                              />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role checkboxes */}
                    {ROLE_COLUMNS.map(({ role, label, cls }) => {
                      const isUser = role === Role.USER;
                      const checked = currentRoles.includes(role);
                      const isDisabled = saving[user._id] || isUser;
                      return (
                        <td key={role} className="py-3 px-3 text-center">
                          <label
                            className={`inline-flex flex-col items-center gap-1 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer group"}`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              disabled={isDisabled}
                              onChange={() => toggleRole(user, role)}
                            />
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
                                checked
                                  ? isUser
                                    ? "border-gray-400 bg-gray-400"
                                    : "border-brand-500 bg-brand-500"
                                  : "border-gray-300 bg-white group-hover:border-brand-400"
                              }`}
                            >
                              {checked && (
                                <svg
                                  viewBox="0 0 10 8"
                                  className="w-3 h-3 text-white fill-none stroke-current stroke-2"
                                >
                                  <polyline points="1,4 4,7 9,1" />
                                </svg>
                              )}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls} ${isUser ? "opacity-50" : ""}`}
                            >
                              {label}
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((user) => {
            const currentRoles = rolesMap[user._id] ?? [Role.USER];
            return (
              <div key={user._id} className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {user.pseudo}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Role toggles */}
                <div className="flex flex-wrap gap-2">
                  {ROLE_COLUMNS.map(({ role, label, cls }) => {
                    const isUser = role === Role.USER;
                    const active = currentRoles.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => toggleRole(user, role)}
                        disabled={saving[user._id] || isUser}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-2 transition-colors disabled:cursor-not-allowed ${
                          active
                            ? isUser
                              ? `${cls} border-current opacity-50`
                              : `${cls} border-current`
                            : "bg-gray-50 text-gray-400 border-gray-200"
                        }`}
                      >
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                        {label}
                      </button>
                    );
                  })}
                </div>

                {saving[user._id] && (
                  <div className="flex items-center gap-1.5 text-xs text-brand-500">
                    <Loader2 size={12} className="animate-spin" />
                    Enregistrement…
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <ShieldCheck size={32} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Aucun membre trouvé</p>
        </div>
      )}
    </div>
  );
}
