import { useContext } from "react";
import { useSelector } from "react-redux";
import { UidContext } from "../AppContext";
import { Menu, LogOut, User } from "lucide-react";
import axios from "axios";
import cookie from "js-cookie";
import { Link } from "react-router-dom";

export default function Topbar({ onToggleSidebar }) {
  const { uid } = useContext(UidContext);
  const userData = useSelector((state) => state.userReducer);

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}api/user/logout`, {
        withCredentials: true,
      });
      cookie.remove("jwt", { expires: 1 });
      window.location = "/";
    } catch (err) {
      console.error(err);
    }
  };

  if (!uid) return null;

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-surface-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left: hamburger */}
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
        aria-label="Menu"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      <div className="hidden lg:block">
        <h2 className="text-lg font-semibold text-gray-800">
          Gestion de stock
        </h2>
      </div>

      {/* Right: user info */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:block">
          Bienvenue,{" "}
          <strong className="text-gray-900">{userData.pseudo}</strong>
        </span>

        <Link
          to="/profil"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {userData.picture ? (
            <img
              src={userData.picture}
              alt={userData.pseudo}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-brand-200"
            />
          ) : (
            <User size={20} className="text-gray-500" />
          )}
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
          aria-label="Se déconnecter"
        >
          <LogOut size={18} />
          <span className="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
