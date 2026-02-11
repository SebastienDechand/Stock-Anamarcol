import { useSelector } from "react-redux";
import { Mail, Phone, Crown, Headset, Warehouse, Wrench } from "lucide-react";

// 3 pôles — match par prénom (1er mot du pseudo)
const POLES = [
  {
    label: "Hotline",
    icon: Headset,
    names: ["franck", "etienne", "étienne"],
    color: "bg-blue-600",
  },
  {
    label: "Entrepôt",
    icon: Warehouse,
    names: ["coline", "sebastien", "sébastien"],
    color: "bg-amber-600",
  },
  {
    label: "Monteur",
    icon: Wrench,
    names: ["thierry", "alain"],
    color: "bg-gray-600",
  },
];

function findUser(users, names) {
  return users.filter((u) => {
    const first = (u.pseudo || "").split(/\s+/)[0].toLowerCase();
    return names.includes(first);
  });
}

function findEdith(users) {
  return users.find(
    (u) => (u.pseudo || "").split(/\s+/)[0].toLowerCase() === "edith",
  );
}

function MemberCard({ user, large }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden ring-1 ring-black/[0.04]">
      <div
        className={`flex items-center gap-4 ${large ? "px-5 py-5" : "px-4 py-4"}`}
      >
        <img
          src={user.picture}
          alt={user.pseudo}
          className={`${large ? "w-20 h-20" : "w-14 h-14"} rounded-full object-cover border-2 border-gray-100 shrink-0`}
        />
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

export default function Membres() {
  const usersData = useSelector((state) => state.usersReducer);
  if (!Array.isArray(usersData)) return null;

  const edith = findEdith(usersData);

  // Collect all known names
  const allKnown = ["edith", ...POLES.flatMap((p) => p.names)];
  const others = usersData.filter((u) => {
    const first = (u.pseudo || "").split(/\s+/)[0].toLowerCase();
    return !allKnown.includes(first);
  });

  return (
    <div className="space-y-4 h-full">
      <h1 className="text-xl font-bold text-gray-900">Équipe</h1>

      {/* Direction — Edith */}
      {edith && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-start-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-md bg-brand-700 flex items-center justify-center">
                <Crown size={13} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Direction
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <MemberCard user={edith} large />
          </div>
        </div>
      )}

      {/* 3 pôles en colonnes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {POLES.map((pole) => {
          const PoleIcon = pole.icon;
          const members = findUser(usersData, pole.names);
          return (
            <div key={pole.label} className="space-y-2">
              {/* Pole header */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-md ${pole.color} flex items-center justify-center`}
                >
                  <PoleIcon size={13} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {pole.label}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              {/* Members */}
              <div className="space-y-2">
                {members.map((user) => (
                  <MemberCard key={user._id} user={user} />
                ))}
                {members.length === 0 && (
                  <p className="text-xs text-gray-400 italic py-2">
                    Aucun membre
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Autres */}
      {others.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Autres
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {others.map((user) => (
              <MemberCard key={user._id} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
