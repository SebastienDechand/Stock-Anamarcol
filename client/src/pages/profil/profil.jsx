import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateNumero } from "../../actions/user.actions";
import { dateParser } from "../../Utils";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Pencil,
  Check,
  X,
} from "lucide-react";

export default function Profil() {
  const dispatch = useDispatch();
  const userData = useSelector((state) => state.userReducer);
  const [numero, setNumero] = useState("");
  const [editingNumero, setEditingNumero] = useState(false);

  const handleUpdate = () => {
    dispatch(updateNumero(userData._id, numero));
    setEditingNumero(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header with avatar */}
        <div className="bg-gradient-to-br from-brand-50 to-brand-100/40 px-6 py-8 flex flex-col items-center">
          <img
            src={userData.picture}
            alt={userData.pseudo}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
          />
          <h2 className="text-lg font-bold text-gray-800 mt-3">
            {userData.pseudo}
          </h2>
          {userData.poste && (
            <p className="text-sm text-brand-700 font-medium mt-0.5">
              {userData.poste}
            </p>
          )}
        </div>

        {/* Info rows */}
        <div className="px-6 py-5 space-y-4 divide-y divide-gray-50">
          <InfoRow icon={User} label="Prénom - Nom" value={userData.pseudo} />
          <InfoRow icon={Briefcase} label="Poste" value={userData.poste} />
          <InfoRow icon={Mail} label="E-mail" value={userData.email} />

          {/* Editable phone number */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Phone size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Numéro de téléphone
              </span>
            </div>
            {editingNumero ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  defaultValue={userData.numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
                <button
                  onClick={handleUpdate}
                  className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingNumero(false)}
                  className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-gray-800">
                  {userData.numero || "–"}
                </p>
                <button
                  onClick={() => setEditingNumero(true)}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                >
                  <Pencil size={12} />
                  Modifier
                </button>
              </div>
            )}
          </div>

          <div className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Dernière modification
              </span>
            </div>
            <p className="text-sm text-gray-800 mt-1">
              {dateParser(userData.updatedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="pt-4 first:pt-0">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-sm text-gray-800">{value || "–"}</p>
    </div>
  );
}
