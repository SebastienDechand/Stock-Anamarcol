import { useSelector } from "react-redux";
import { dateParser } from "../../Utils";
import "./ContactModale.css";

const ContactModale = ({ onClose, contactId }) => {
  // const [file, setFile] = useState();
  // const dispatch = useDispatch();
  const { selectedContactInfo } = useSelector((state) => state.contactsReducer);
  // const currentUser = useSelector((state) => state.userReducer);

  // const handlePicture = async (event) => {
  //     event.preventDefault();

  //     if (selectedContactInfo && selectedContactInfo._id && file && currentUser && currentUser._id) {
  //         const modifierId = typeof currentUser._id === 'string' ? currentUser._id : currentUser._id[0];

  //         const data = new FormData();
  //         data.append("nom", selectedContactInfo.nom);
  //         data.append("contactId", selectedContactInfo._id);
  //         data.append("file", file);
  //         data.append("modifierId", modifierId);

  //         try {
  //             await dispatch(uploadContactPicture(data, selectedContactInfo._id, modifierId));
  //             dispatch(getAllContacts())
  //         } catch (error) {
  //             console.error("Erreur lors de l'envoi de l'image :", error);
  //         }
  //     } else {
  //         console.error("Les informations nécessaires ne sont pas disponibles.");
  //     }
  // };

  return (
    <div className="modal-overlay">
      <div className="modal-content-add">
        <button className="modal-close" onClick={onClose} aria-label="Fermer">
          X
        </button>

        <div className="modal-ctn">
          <div className="modal-left">
            <h4>Photo du contact</h4>
            {selectedContactInfo && selectedContactInfo.picture ? (
              <>
                <img src={selectedContactInfo.picture} alt="Contact" />
                {/* <form  onSubmit={handlePicture} className="upload-image">
                                    <label htmlFor="file">Parcourir...</label>
                                    <input 
                                        type="file" 
                                        id="file" 
                                        name="file" 
                                        accept=".jpg, .jpeg, .png" 
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="upload-image-btn"
                                    />
                                    <br/>
                                    <input type="submit" value="Envoyer" className="modal-btn" />
                                </form> */}
                <p className="error-message-contact"></p>
              </>
            ) : (
              <p>Aucune image disponible</p>
            )}
          </div>

          <div className="modal-right">
            <div className="modal-infos">
              <h4>Nom</h4>
              <p>{selectedContactInfo ? selectedContactInfo.nom : ""}</p>
            </div>
            {selectedContactInfo && selectedContactInfo.poste ? (
              <div className="modal-infos">
                <h4>Poste</h4>
                <p>{selectedContactInfo ? selectedContactInfo.poste : ""}</p>
              </div>
            ) : (
              ""
            )}
            {selectedContactInfo && selectedContactInfo.lien ? (
              <div className="modal-infos">
                <h4>Lien du site</h4>
                <p>{selectedContactInfo ? selectedContactInfo.lien : ""}</p>
              </div>
            ) : (
              ""
            )}

            <div className="modal-infos">
              <h4>Email</h4>
              <p>{selectedContactInfo ? selectedContactInfo.email : ""}</p>
            </div>
            <div className="modal-infos">
              <h4>Téléphone</h4>
              <p>{selectedContactInfo ? selectedContactInfo.tel : ""}</p>
            </div>
            {/* <button className='valider-btn' onClick={handleUpdate}>Valider modifications</button> */}
            <div className="modal-infos">
              <h4>Modifié le : </h4>
              <p>
                {dateParser(
                  selectedContactInfo ? selectedContactInfo.updatedAt : ""
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModale;
