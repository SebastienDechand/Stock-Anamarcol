import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import {
  Home,
  Package,
  Users,
  Contact,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Truck,
} from "lucide-react";
import { useContext } from "react";
import { UidContext } from "../AppContext";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const baseNav: NavItem[] = [
  { to: "/home", label: "Accueil", icon: Home },
  { to: "/articles", label: "Articles", icon: Package },
  { to: "/membres", label: "Membres", icon: Users },
  { to: "/contacts", label: "Contacts", icon: Contact },
  { to: "/profil", label: "Profil", icon: UserCircle },
];

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation();
  const auth = useContext(UidContext);
  // Sidebar: envois visible to all; history only for admins/superadmins
  const isAdminOrSuper = auth?.isAdmin || auth?.isSuperadmin;
  const navItems: NavItem[] = [
    ...baseNav,
    { to: "/envois", label: "Envois", icon: Truck },
    ...(isAdminOrSuper
      ? [{ to: "/history", label: "Historique", icon: Package }]
      : []),
  ];

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 flex flex-col bg-brand-900 transition-all duration-300 ease-in-out",
          open ? "w-64" : "w-0 lg:w-20",
          !open && "overflow-hidden lg:overflow-visible",
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-brand-800 shrink-0">
          {open && (
            <Link to="/home" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                <Package size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                AnaMarCol
              </span>
            </Link>
          )}
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              "p-1.5 rounded-lg hover:bg-brand-800 transition-colors hidden lg:flex",
              !open && "mx-auto",
            )}
            aria-label={open ? "Réduire" : "Agrandir"}
          >
            {open ? (
              <ChevronLeft size={18} className="text-brand-300" />
            ) : (
              <ChevronRight size={18} className="text-brand-300" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => {
                  if (window.innerWidth < 1024) setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-brand-700/50 text-white"
                    : "text-brand-200 hover:bg-brand-800 hover:text-white",
                  !open && "lg:justify-center lg:px-0",
                )}
                title={!open ? label : undefined}
              >
                <Icon
                  size={20}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-brand-300" : "text-brand-400",
                  )}
                />
                {open && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {open && (
          <div className="px-4 py-3 border-t border-brand-800">
            <p className="text-xs text-brand-400 text-center">
              Stock Manager v2.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
