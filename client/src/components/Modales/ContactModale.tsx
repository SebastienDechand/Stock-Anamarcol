import { useState, useRef, useEffect, useContext } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import {
  uploadContactPicture,
  updateContact,
} from "../../actions/contacts.action";
import { dateParser } from "../../Utils";
import { UidContext } from "../AppContext";
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "../../constants";
import { X, Mail, Phone, Globe, Briefcase, Camera } from "lucide-react";
import Portal from "../Portal";
import type { ContactsState } from "../../types";

interface ContactModaleProps {
  onClose: () => void;
  contactId?: string | null;
}

const ContactModale = ({ onClose }: ContactModaleProps) => {
  const { selectedContactInfo } = useSelector(
    (state: { contactsReducer: ContactsState }) => state.contactsReducer,
  );
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    poste: "",
    tel: "",
    lien: "",
  });
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (selectedContactInfo) {
      setForm({
        nom: selectedContactInfo.nom || "",
        email: selectedContactInfo.email || "",
        poste: selectedContactInfo.poste || "",
        tel: selectedContactInfo.tel || "",
        lien: selectedContactInfo.lien || "",
      });
      setPreview(selectedContactInfo.picture || null);
    }
  }, [selectedContactInfo]);

  const authContext = useContext(UidContext);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">
              Détail du contact
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-4">
              <img
                src={preview || ""}
                alt={selectedContactInfo?.nom || "contact"}
                className="w-16 h-16 rounded-full object-cover"
              />
              {authContext?.isAdmin && (
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f || !selectedContactInfo) return;
                      if (
                        !(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(
                          f.type,
                        )
                      ) {
                        alert("Type de fichier non supporté.");
                        return;
                      }
                      if (f.size > MAX_FILE_SIZE) {
                        alert("Fichier trop volumineux.");
                        return;
                      }
                      try {
                        const objectUrl = URL.createObjectURL(f);
                        setPreview(objectUrl);
                      } catch (err) {
                        console.error(err);
                      }
                      const fd = new FormData();
                      fd.append("file", f);
                      fd.append("contactId", selectedContactInfo._id);
                      try {
                        await dispatch(
                          uploadContactPicture(fd, selectedContactInfo._id),
                        );
                        const pic =
                          (selectedContactInfo &&
                            selectedContactInfo.picture) ||
                          null;
                        setPreview(pic ? pic + "?t=" + Date.now() : null);
                        toast.success("Photo du contact mise à jour");
                      } catch (err) {
                        console.error(err);
                        toast.error("Erreur lors de l'upload.");
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
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Poste</label>
                <input
                  value={form.poste}
                  onChange={(e) => setForm({ ...form, poste: e.target.value })}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <div className="w-36">
                  <label className="text-xs text-gray-500">Tél.</label>
                  <input
                    value={form.tel}
                    onChange={(e) => setForm({ ...form, tel: e.target.value })}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 pt-3 border-t border-gray-100">
              Modifié le {dateParser(selectedContactInfo?.updatedAt || "")}
            </p>

            {authContext?.isAdmin && (
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={onClose} className="px-3 py-2 border rounded">
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (!selectedContactInfo) return;
                    try {
                      await dispatch(
                        updateContact(selectedContactInfo._id, form),
                      );
                      toast.success("Contact mis à jour");
                      onClose();
                    } catch (err) {
                      console.error(err);
                      toast.error("Impossible de sauvegarder le contact");
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
};

export default ContactModale;
