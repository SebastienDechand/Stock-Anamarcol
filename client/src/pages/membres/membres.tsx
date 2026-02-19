import { useSelector } from "react-redux";
import { useState, useContext, useEffect } from "react";
import UserModale from "../../components/Modales/UserModale";
import AddMemberModale from "../../components/Modales/AddMemberModale";
import { UidContext } from "../../components/AppContext";
import { useAppDispatch } from "../../hooks/redux";
import { deleteUser, getAllUsers } from "../../actions/users.actions";
import { Mail, Phone, Trash2, Users } from "lucide-react";
import {
  POLES,
  POLE_DIRECTION,
  POLE_ENTREPOT,
  POLE_GESTION,
  Role,
} from "../../constants";
import type { PoleInfo } from "../../constants";
import type { User } from "../../types";

// Role display configuration (USER badge is intentionally omitted - it’s implicit)
const ROLE_BADGE: Partial<Record<Role, { label: string; cls: string }>> = {
  [Role.HOTLINE]: { label: "Hotline", cls: "bg-sky-100 text-sky-700" },
  [Role.MONTEUR]: { label: "Monteur", cls: "bg-amber-100 text-amber-700" },
  [Role.ADMIN]: { label: "Admin", cls: "bg-violet-100 text-violet-700" },
  [Role.SUPERADMIN]: { label: "Super Admin", cls: "bg-red-100 text-red-700" },
};

// Legacy names for backward compatibility (when pole is not yet set in DB)
const LEGACY_NAMES: Record<string, string[]> = {
  Direction: ["edith"],
  Hotline: ["franck", "etienne", "étienne"],
  Entrepôt: [],
  Monteur: ["thierry", "alain"],
  "Gestion du site": ["sebastien", "sébastien"],
};

function getUserPole(user: User): string {
  if (user.pole) return user.pole;
  // Fallback: search by first name
  const first = (user.pseudo || "").split(/\s+/)[0].toLowerCase();
  for (const [pole, names] of Object.entries(LEGACY_NAMES)) {
    if (names.includes(first)) return pole;
  }
  return "";
}

function getUsersByPole(users: User[], pole: string): User[] {
  return users.filter((u) => getUserPole(u) === pole);
}

interface MemberCardProps {
  user: User;
  large?: boolean;
  showRoles?: boolean;
}

function MemberCard({ user, large, showRoles }: MemberCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden ring-1 ring-black/[0.04]">
      <div
        className={`flex items-center gap-4 ${large ? "px-5 py-5" : "px-4 py-4"}`}
      >
        {user.picture ? (
          <img
            src={user.picture}
            alt={user.pseudo}
            className={`${large ? "w-20 h-20" : "w-14 h-14"} rounded-full object-cover border-2 border-gray-100 shrink-0`}
          />
        ) : (
          <div
            className={`${large ? "w-20 h-20 text-2xl" : "w-14 h-14 text-lg"} rounded-full bg-gray-100 border-2 border-gray-100 shrink-0 flex items-center justify-center text-gray-400 font-semibold`}
          >
            {(user.pseudo || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3
            className={`${large ? "text-lg" : "text-[15px]"} font-semibold text-gray-900 truncate`}
          >
            {user.pseudo}
          </h3>
          {user.poste && (
            <p
              className={`${large ? "text-sm" : "text-xs"} text-brand-600 font-medium truncate mt-0.5`}
            >
              {user.poste}
            </p>
          )}
          {/* Role badges — admins only */}
          {showRoles &&
            (() => {
              const roles =
                user.roles && user.roles.length > 0 ? user.roles : [];
              const badges = roles
                .map((r) => ROLE_BADGE[r])
                .filter((b): b is NonNullable<typeof b> => !!b);
              return badges.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {badges.map((b, i) => (
                    <span
                      key={i}
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${b.cls}`}
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {user.email && (
              <span
                className={`flex items-center gap-1.5 ${large ? "text-sm" : "text-xs"} text-gray-400 truncate`}
              >
                <Mail size={large ? 14 : 12} className="shrink-0" />
                {user.email}
              </span>
            )}
            {user.numero && (
              <span
                className={`flex items-center gap-1.5 ${large ? "text-sm" : "text-xs"} text-gray-400`}
              >
                <Phone size={large ? 14 : 12} className="shrink-0" />
                {user.numero}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PoleHeaderProps {
  pole: PoleInfo;
}

function PoleHeader({ pole }: PoleHeaderProps) {
  const Icon = pole.icon;
  return (
    <div className="flex items-center gap-2 mb-2">
      <div
        className={`w-6 h-6 rounded-md ${pole.color} flex items-center justify-center`}
      >
        <Icon size={13} className="text-white" />
      </div>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {pole.label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

interface MemberListProps {
  members: User[];
  onSelect: (u: User) => void;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  canDelete: boolean;
  /*  */ canSelect: boolean;
  showRoles?: boolean;
}

function MemberList({
  members,
  onSelect,
  deleteConfirmId,
  setDeleteConfirmId,
  canDelete,
  canSelect,
  showRoles,
}: MemberListProps) {
  const dispatch = useAppDispatch();

  return (
    <div className="space-y-2">
      {members.map((user) => (
        <div key={user._id} className="relative">
          <div
            onClick={() => canSelect && onSelect(user)}
            className={canSelect ? "cursor-pointer" : ""}
          >
            <MemberCard user={user} showRoles={showRoles} />
          </div>
          {canDelete && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(
                    deleteConfirmId === user._id ? null : user._id,
                  );
                }}
                className="absolute top-1.5 right-1.5 p-1 bg-red-50 rounded-full text-red-400 hover:text-white hover:bg-red-500 transition-all z-10"
                title="Supprimer"
              >
                <Trash2 size={12} />
              </button>
              {deleteConfirmId === user._id && (
                <div
                  className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2 rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-medium text-gray-700">
                    Supprimer ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await dispatch(deleteUser(user._id));
                        setDeleteConfirmId(null);
                        await dispatch(getAllUsers());
                      }}
                      className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-medium rounded-md hover:bg-red-700"
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-md hover:bg-gray-200"
                    >
                      Non
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ))}
      {members.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">Aucun membre</p>
      )}
    </div>
  );
}

export default function Membres() {
  const usersData = useSelector(
    (state: { usersReducer: User[] }) => state.usersReducer,
  );
  const auth = useContext(UidContext);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!Array.isArray(usersData)) return null;

  const direction = getUsersByPole(usersData, "Direction");
  const gestion = getUsersByPole(usersData, "Gestion du site");

  const allKnownPoles = [
    "Direction",
    ...POLES.map((p) => p.label),
    "Gestion du site",
  ];
  const others = usersData.filter(
    (u) => !allKnownPoles.includes(getUserPole(u)),
  );

  // Sync selectedUser avec le store
  useEffect(() => {
    if (!selectedUser) return;
    const updated = usersData.find((u) => u._id === selectedUser._id);
    if (updated) setSelectedUser(updated);
  }, [usersData]);

  const isAdmin = !!auth?.isAdmin;
  const isSuperadmin = !!auth?.isSuperadmin;

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users size={20} className="text-brand-600 shrink-0" />
          Équipe
        </h1>
        {isSuperadmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3 py-2 bg-brand-600 text-white rounded"
          >
            Ajouter un membre
          </button>
        )}
      </div>

      {/* Direction (centered) */}
      <div className="flex justify-center">
        <div className="w-full max-w-md">
          <PoleHeader pole={POLE_DIRECTION} />
          <div className="space-y-2">
            {direction.map((user) => (
              <div
                key={user._id}
                className={isAdmin ? "cursor-pointer" : ""}
                onClick={() => isAdmin && setSelectedUser(user)}
              >
                <MemberCard user={user} large showRoles={isAdmin} />
              </div>
            ))}
            {direction.length === 0 && (
              <p className="text-xs text-gray-400 italic py-2">Aucun membre</p>
            )}
          </div>
        </div>
      </div>

      {/* Operational poles: Hotline (+ Warehouse), Installer, Site Management */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Hotline + Warehouse sub-section */}
        <div>
          <PoleHeader pole={POLES[0]} />
          <MemberList
            members={getUsersByPole(usersData, "Hotline")}
            onSelect={setSelectedUser}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            canDelete={isSuperadmin}
            canSelect={isAdmin}
            showRoles={isAdmin}
          />
          <div className="mt-4">
            <PoleHeader pole={POLE_ENTREPOT} />
            <MemberList
              members={getUsersByPole(usersData, "Entrepôt")}
              onSelect={setSelectedUser}
              deleteConfirmId={deleteConfirmId}
              setDeleteConfirmId={setDeleteConfirmId}
              canDelete={isSuperadmin}
              canSelect={isAdmin}
              showRoles={isAdmin}
            />
          </div>
        </div>

        {/* Monteur */}
        <div>
          <PoleHeader pole={POLES[1]} />
          <MemberList
            members={getUsersByPole(usersData, "Monteur")}
            onSelect={setSelectedUser}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            canDelete={isSuperadmin}
            canSelect={isAdmin}
            showRoles={isAdmin}
          />
        </div>

        {/* Gestion du site */}
        <div>
          <PoleHeader pole={POLE_GESTION} />
          <MemberList
            members={gestion}
            onSelect={setSelectedUser}
            deleteConfirmId={deleteConfirmId}
            setDeleteConfirmId={setDeleteConfirmId}
            canDelete={isSuperadmin}
            canSelect={isAdmin}
            showRoles={isAdmin}
          />
        </div>
      </div>

      {selectedUser && (
        <UserModale user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {isAddOpen && <AddMemberModale onClose={() => setIsAddOpen(false)} />}
    </div>
  );
}
