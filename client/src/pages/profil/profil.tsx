import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import { updateNumero, uploadPicture } from "../../actions/user.actions";
import { dateParser } from "../../Utils";
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "../../constants";
import {
  User,
  UserCircle,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Pencil,
  Check,
  X,
  Camera,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User as UserType } from "../../types";

export default function Profil() {
  const dispatch = useAppDispatch();
  const userData = useSelector(
    (state: { userReducer: Partial<UserType> }) => state.userReducer,
  );
  const [numero, setNumero] = useState("");
  const [editingNumero, setEditingNumero] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");

    if (
      !ACCEPTED_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
      )
    ) {
      setUploadError("Format non supporté. Utilisez JPG ou PNG.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Fichier trop volumineux (max 2.5 Mo).");
      return;
    }

    const data = new FormData();
    data.append("name", userData.pseudo || "profil");
    data.append("userId", userData._id || "");
    data.append("file", file);

    dispatch(uploadPicture(data, userData._id || ""))
      .then(() => toast.success("Photo de profil mise à jour"))
      .catch(() => {
        setUploadError("Erreur lors de l'upload.");
        toast.error("Erreur lors de l'upload de la photo");
      });
  };

  const handleUpdate = () => {
    if (userData._id) {
      dispatch(updateNumero(userData._id, numero))
        .then(() => toast.success("Numéro mis à jour"))
        .catch(() => toast.error("Impossible de mettre à jour le numéro"));
    }
    setEditingNumero(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <UserCircle size={20} className="text-brand-600 shrink-0" />
        Mon profil
      </h1>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header with avatar */}
        <div className="bg-gradient-to-br from-brand-50 to-brand-100/40 px-6 py-8 flex flex-col items-center">
          <div
            className="relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {userData.picture ? (
              <img
                src={userData.picture}
                alt={userData.pseudo}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md flex items-center justify-center text-gray-400 text-3xl font-semibold">
                {(userData.pseudo || "?")[0].toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png"
              className="hidden"
              onChange={handlePictureUpload}
            />
          </div>
          {uploadError && (
            <p className="text-xs text-red-500 mt-2">{uploadError}</p>
          )}
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
                  title="Enregistrer"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditingNumero(false)}
                  className="p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Annuler"
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
              {dateParser(userData.updatedAt || "")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
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
