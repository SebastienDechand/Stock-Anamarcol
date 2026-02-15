import { useState } from "react";
import { X } from "lucide-react";
import { useAppDispatch } from "../../hooks/redux";
import { addUser } from "../../actions/users.actions";
import { ALL_POLE_LABELS } from "../../constants";
import Portal from "../Portal";

interface Props {
  onClose: () => void;
}

export default function AddMemberModale({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    pseudo: "",
    email: "",
    password: "",
    poste: "",
    numero: "",
    pole: "",
  });
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    setError(null);
    if (!form.pseudo || form.pseudo.trim().length < 3) {
      setError("Le nom doit contenir au moins 3 caractères.");
      return false;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email)) {
      setError("Email invalide.");
      return false;
    }
    if (!form.password || form.password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return false;
    }
    if (form.numero && !/^\d+$/.test(form.numero)) {
      setError("Le numéro ne doit contenir que des chiffres.");
      return false;
    }
    if (!form.pole) {
      setError("Veuillez choisir un pôle.");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      await dispatch(addUser(form));
      onClose();
    } catch (err: any) {
      console.error(err);
      const resp = err?.response?.data;
      if (resp) {
        if (resp.errors) {
          const e = resp.errors as Record<string, string>;
          const first =
            e.pseudo ||
            e.email ||
            e.password ||
            Object.values(e).find(Boolean) ||
            JSON.stringify(e);
          setError(String(first));
          return;
        }
        if (resp.message) {
          setError(String(resp.message));
          return;
        }
      }
      setError("Erreur lors de la création.");
    }
  };

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
          <h3 className="font-semibold">Ajouter un membre</h3>
          <button onClick={onClose} className="p-1 text-gray-500" title="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-gray-500">Nom</label>
            <input
              value={form.pseudo}
              onChange={(e) => setForm({ ...form, pseudo: e.target.value })}
              className="w-full border rounded px-2 py-1.5 mt-0.5"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded px-2 py-1.5 mt-0.5"
              />
            </div>
            <div className="w-36">
              <label className="text-xs text-gray-500">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border rounded px-2 py-1.5 mt-0.5"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500">Pôle</label>
              <select
                value={form.pole}
                onChange={(e) => setForm({ ...form, pole: e.target.value })}
                className="w-full border rounded px-2 py-1.5 mt-0.5"
              >
                <option value="">-- Choisir --</option>
                {ALL_POLE_LABELS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500">Poste (optionnel)</label>
              <input
                value={form.poste}
                onChange={(e) => setForm({ ...form, poste: e.target.value })}
                placeholder="Ex: Responsable..."
                className="w-full border rounded px-2 py-1.5 mt-0.5"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">Téléphone (optionnel)</label>
            <input
              value={form.numero}
              onChange={(e) =>
                setForm({ ...form, numero: e.target.value.replace(/\D/g, "") })
              }
              className="w-full border rounded px-2 py-1.5 mt-0.5"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="px-5 py-3 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 border rounded">
            Annuler
          </button>
          <button
            onClick={handleCreate}
            className="px-3 py-2 bg-brand-600 text-white rounded"
          >
            Créer
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
}
