import { useSelector } from "react-redux";
import { dateParser } from "../../Utils";
import { X, Mail, Phone, Globe, Briefcase } from "lucide-react";
import type { ContactsState } from "../../types";

interface ContactModaleProps {
  onClose: () => void;
  contactId?: string | null;
}

const ContactModale = ({ onClose }: ContactModaleProps) => {
  const { selectedContactInfo } = useSelector(
    (state: { contactsReducer: ContactsState }) => state.contactsReducer,
  );

  return (
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
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row">
          {/* Left — Image */}
          <div className="sm:w-2/5 bg-gray-50 flex items-center justify-center p-6">
            {selectedContactInfo?.picture ? (
              <img
                src={selectedContactInfo.picture}
                alt="Contact"
                className="max-h-48 max-w-full object-contain rounded-lg"
              />
            ) : (
              <p className="text-sm text-gray-400">Aucune image</p>
            )}
          </div>

          {/* Right — Info */}
          <div className="sm:w-3/5 px-6 py-5 space-y-4">
            {selectedContactInfo?.nom && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                  Nom
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedContactInfo.nom}
                </p>
              </div>
            )}

            {selectedContactInfo?.poste && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase size={14} className="text-gray-400 shrink-0" />
                {selectedContactInfo.poste}
              </div>
            )}

            {selectedContactInfo?.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400 shrink-0" />
                {selectedContactInfo.email}
              </div>
            )}

            {selectedContactInfo?.tel && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400 shrink-0" />
                {selectedContactInfo.tel}
              </div>
            )}

            {selectedContactInfo?.lien && (
              <a
                href={selectedContactInfo.lien}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
              >
                <Globe size={14} className="shrink-0" />
                Voir le site
              </a>
            )}

            <p className="text-[11px] text-gray-400 pt-3 border-t border-gray-100">
              Modifié le {dateParser(selectedContactInfo?.updatedAt || "")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModale;
