import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom';
import './contacts.css'
import No from '../../assets/no.png'
import Header from '../../components/Header/Header'
import Menu from '../../components/Menu/Menu'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedContactId } from '../../actions/contacts.action'
import ContactModale from '../../components/Modales/ContactModale'
import { UidContext } from '../../components/AppContext';

const Contacts = () => {
  const dispatch = useDispatch();
  const contactsData = useSelector((state) => state.contactsReducer.contactsData)
  const [isContactModaleOpen, setIsContactModaleOpen] = useState(false);
  const selectedContactId = useSelector((state) => state.contactsReducer.selectedContactId);
  const userDataId = useSelector((state) => state.userReducer._id)
  const uid = useContext(UidContext)
  const isMenuOpen = useSelector((state) => state.menuReducer.isMenuOpen);

  const handleContactClick = (contactId) => {
    dispatch(setSelectedContactId(contactId));
    setIsContactModaleOpen(true);
  };
  const closeAddModal = () => {
    dispatch(setSelectedContactId(null));
    setIsContactModaleOpen(false);
  };

  return (
    <div>
      {uid ? (
        <div>
          <Header />
          <div className='contact-ctn'>
            <Menu />
            <div className={`contact-flex main-content ${isMenuOpen ? 'visible' : 'closed'}`}>
              <ul className='all-contact '>
                <li>
                  <h2 className='contact-title'>Contacts Extérieurs</h2>
                  <div className="contacts-row">
                    {contactsData.slice(0, 3).map((contact) => (
                      <div key={contact._id} className='contact-item' onClick={() => handleContactClick(contact._id)}>
                        {contact.poste && <h3 className={!contact.poste ? 'display-none' : ''}>{contact.poste}</h3>}
                        <img 
                          src={contact.picture}
                          alt="Logo du contact"
                          className='contact-img'
                        />
                        {contact.lien && <a href={contact.lien} target="_blank" rel="noopener noreferrer">Lien vers le site</a>}
                        {contact.nom && <h3>{contact.nom}</h3>}
                        {contact.email && <p>{contact.email}</p>}
                        {contact.tel && <p>{contact.tel}</p>}
                      </div>
                    ))}
                  </div>
                </li>
                <li>
                  <h2 className='contact-title'>Fournisseurs Extérieurs</h2>
                  <div className="contacts-row">
                    {contactsData.slice(3, 6).map((contact) => (
                      <div key={contact._id} className="contact-item" onClick={() => handleContactClick(contact._id)}>
                        {contact.poste && <h3 className={!contact.poste ? 'display-none' : ''}>{contact.poste}</h3>}
                        <img 
                          src={contact.picture}
                          alt="Logo du contact"
                          className='contact-img'
                        />
                          <a href={contact.lien} target="_blank" rel="noopener noreferrer">
                            Lien vers le site
                          </a>
                        {contact.nom && <h3>{contact.nom}</h3>}
                        {contact.email && <p>{contact.email}</p>}
                        {contact.tel && <p>{contact.tel}</p>}
                      </div>
                    ))}
                  </div>
                </li>
              </ul>
            </div> 
            {
              (userDataId === '65afe8c7c307f521781311fd' || userDataId === '65afe8e4c307f52178131201') 
              && isContactModaleOpen
              && <ContactModale onClose={closeAddModal} contactId={selectedContactId} />
            }
          </div>
        </div>
      ) : 
        <div className='login-false'>
          <h1>Vous n'êtes pas connecté.</h1>
          <img src={No} alt='Panneau interdit'/>
          <h2><Link to='/'>Retour à la page de connexion</Link></h2>
        </div>
      }
        
      </div>
  )
}

export default Contacts
