import { useContext, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import { setSelectedContactId } from "../../actions/contacts.action";
import ContactModale from "../../components/Modales/ContactModale";
import { UidContext } from "../../components/AppContext";
import {
  Globe,
  Mail,
  Phone,
  Users,
  Contact as ContactIcon,
} from "lucide-react";
import type { Contact, ContactsState } from "../../types";

const Contacts = () => {
  const dispatch = useAppDispatch();
  const authContext = useContext(UidContext);
  const isAdmin = authContext?.isAdmin;
  const contactsData = useSelector(
    (state: { contactsReducer: ContactsState }) =>
      state.contactsReducer.contactsData,
  );
  const [isContactModaleOpen, setIsContactModaleOpen] = useState(false);
  const selectedContactId = useSelector(
    (state: { contactsReducer: ContactsState }) =>
      state.contactsReducer.selectedContactId,
  );

  const handleContactClick = (contactId: string) => {
    dispatch(setSelectedContactId(contactId));
    setIsContactModaleOpen(true);
  };

  const closeModal = () => {
    dispatch(setSelectedContactId(null));
    setIsContactModaleOpen(false);
  };

  const exterieurs = contactsData.slice(0, 3);
  const fournisseurs = contactsData.slice(3, 6);

  const ContactCard = ({ contact }: { contact: Contact }) => (
    <div
      onClick={() => isAdmin && handleContactClick(contact._id)}
      className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-shadow group ${isAdmin ? "cursor-pointer hover:shadow-md" : ""}`}
    >
      <div className="flex items-center gap-4">
        {contact.picture ? (
          <img
            src={contact.picture}
            alt={contact.nom || "Contact"}
            className="w-14 h-14 rounded-full object-cover bg-gray-100 border-2 border-gray-50"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-50 flex items-center justify-center text-gray-400 text-lg font-semibold shrink-0">
            {(contact.nom || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {contact.poste && (
            <p className="text-[11px] font-medium text-brand-600 uppercase tracking-wide mb-0.5">
              {contact.poste}
            </p>
          )}
          {contact.nom && (
            <h3 className="text-sm font-semibold text-gray-800 truncate">
              {contact.nom}
            </h3>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {contact.email && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Mail size={13} className="text-gray-400 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </div>
        )}
        {contact.tel && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone size={13} className="text-gray-400 shrink-0" />
            <span>{contact.tel}</span>
          </div>
        )}
        {contact.lien && (
          <a
            href={contact.lien}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700"
          >
            <Globe size={13} className="shrink-0" />
            Voir le site
          </a>
        )}
      </div>
    </div>
  );

  const Section = ({
    title,
    contacts,
  }: {
    title: string;
    contacts: Contact[];
  }) => (
    <div>
      <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Users size={18} className="text-gray-400" />
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.map((contact) => (
          <ContactCard key={contact._id} contact={contact} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 mt-0">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <ContactIcon size={20} className="text-brand-600 shrink-0" />
        Contacts
      </h1>

      {exterieurs.length > 0 && (
        <Section title="Contacts Extérieurs" contacts={exterieurs} />
      )}
      {fournisseurs.length > 0 && (
        <Section title="Fournisseurs Extérieurs" contacts={fournisseurs} />
      )}

      {isAdmin && isContactModaleOpen && (
        <ContactModale onClose={closeModal} contactId={selectedContactId} />
      )}
    </div>
  );
};

export default Contacts;
