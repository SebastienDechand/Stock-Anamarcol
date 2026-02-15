import { useState, useRef, useEffect, useContext } from "react";
import { useAppDispatch } from "../../hooks/redux";
import { UidContext } from "../../components/AppContext";
import {
  uploadProfilePicture,
  updateUser,
} from "../../actions/userClient.actions";
import { X, Camera } from "lucide-react";
import { ALL_POLE_LABELS } from "../../constants";
import Portal from "../Portal";
import type { User } from "../../types";

interface UserModaleProps {
  onClose: () => void;
  user: User;
}

export default function UserModale({ onClose, user }: UserModaleProps) {
  const auth = useContext(UidContext);
  const dispatch = useAppDispatch();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    pseudo: user.pseudo || "",
    poste: user.poste || "",
    email: user.email || "",
    numero: user.numero || "",
    pole: user.pole || "",
  });

  useEffect(() => {
    setForm({
      pseudo: user.pseudo || "",
      poste: user.poste || "",
      email: user.email || "",
      numero: user.numero || "",
      pole: user.pole || "",
    });
  }, [user]);

  const isSuperadmin = !!auth?.isSuperadmin;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="font-semibold">Profil</h3>
            <button onClick={onClose} className="p-1 text-gray-500">
              <X size={16} />
            </button>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.pseudo}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xl font-semibold">
                  {(user.pseudo || "?")[0].toUpperCase()}
                </div>
              )}
              {isSuperadmin && (
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const fd = new FormData();
                      fd.append("file", f);
                      fd.append("userId", user._id);
                      fd.append("name", user.pseudo || "user");
                      try {
                        await dispatch(uploadProfilePicture(fd));
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="mt-1 px-2 py-1 border rounded flex items-center gap-2"
                  >
                    <Camera size={14} />
                    Changer
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-500">Nom</label>
                <input
                  value={form.pseudo}
                  onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
                  disabled={!isSuperadmin}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Pôle</label>
                  <select
                    value={form.pole}
                    onChange={(e) => setForm({ ...form, pole: e.target.value })}
                    disabled={!isSuperadmin}
                    className="w-full border rounded px-2 py-1"
                  >
                    <option value="">-- Aucun --</option>
                    {ALL_POLE_LABELS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Poste</label>
                  <input
                    value={form.poste}
                    onChange={(e) =>
                      setForm({ ...form, poste: e.target.value })
                    }
                    disabled={!isSuperadmin}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    disabled={!isSuperadmin}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div className="w-36">
                  <label className="text-xs text-gray-500">Tél.</label>
                  <input
                    value={form.numero}
                    onChange={(e) =>
                      setForm({ ...form, numero: e.target.value })
                    }
                    disabled={!isSuperadmin}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </div>
            </div>

            {isSuperadmin && (
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={onClose} className="px-3 py-2 border rounded">
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    try {
                      await dispatch(updateUser(user._id, form));
                      onClose();
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="px-3 py-2 bg-brand-600 text-white rounded"
                >
                  Sauvegarder
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
