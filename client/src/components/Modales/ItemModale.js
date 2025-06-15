import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setModifierName,
  updateQuantite,
  updateQuantiteSuccess,
} from "../../actions/item.actions";
import { dateParser } from "../../Utils";
import "./ItemModale.css";

const ItemModale = ({ onClose }) => {
  // const [file, setFile] = useState();
  const dispatch = useDispatch();
  const { selectedItemInfo, selectedItemQuantite } = useSelector(
    (state) => state.itemReducer
  );
  const currentUser = useSelector((state) => state.userReducer);
  const userDataId = currentUser._id;
  const modifierName = useSelector((state) => state.userReducer.pseudo);
  const [quantite, setQuantite] = useState(selectedItemQuantite || "");
  const [updateForm, setUpdateForm] = useState(false);
  const posterId = selectedItemInfo?.posterId;
  const users = useSelector((state) => state.usersReducer || []);

  const findUserById = (users, id) => {
    return users.find((user) => user._id === id);
  };
  const matchingUser = findUserById(users, posterId);

  // const handlePicture = async (e) => {
  //     e.preventDefault();

  //     if (selectedItemInfo && selectedItemInfo._id && file && currentUser && currentUser._id) {
  //         const modifierId = currentUser._id;

  //         const data = new FormData();
  //         data.append("denomination", selectedItemInfo.denomination);
  //         data.append("fournisseur", selectedItemInfo.fournisseur);
  //         data.append("etat", selectedItemInfo.etat);
  //         data.append("itemId", selectedItemInfo._id);
  //         data.append("file", file);
  //         data.append("modifierId", modifierId);

  //         try {
  //             await dispatch(uploadItemPicture(data, selectedItemInfo._id, modifierId));

  //         } catch (error) {
  //             console.error("Erreur lors de l'envoi de l'image :", error);
  //         }
  //     } else {
  //         console.error("Les informations nécessaires ne sont pas disponibles.");
  //     }
  // };

  const handleUpdate = async () => {
    try {
      if (selectedItemInfo && selectedItemInfo._id) {
        await dispatch(
          updateQuantite(selectedItemInfo._id, quantite, modifierName)
        );
        setUpdateForm(false);

        dispatch(
          updateQuantiteSuccess(selectedItemInfo._id, quantite, modifierName)
        );
        dispatch(setModifierName(modifierName));
      } else {
        console.error("L'ID de l'article est indéfini.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la quantité :", error);
    }
  };

  useEffect(() => {
    if (selectedItemQuantite !== undefined) {
      setQuantite(selectedItemQuantite);
    }
  }, [selectedItemQuantite]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="modal-close" aria-label="Fermer">
          X
        </button>
        <div className="modal-ctn">
          <div className="modal-left">
            <h4>Photo de l'article</h4>
            {selectedItemInfo && selectedItemInfo.image ? (
              <>
                <img
                  src={selectedItemInfo.image}
                  alt="Article"
                  className="modal-left-img"
                />
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
                                    <input type="submit" value="Envoyer" className="modal-btn"/>
                                </form> */}
                <p className="error-message"></p>
              </>
            ) : (
              <p>Aucune image disponible</p>
            )}
            {posterId &&
              (userDataId === "65afe8c7c307f521781311fd" ||
                userDataId === "65afe8e4c307f52178131201") && (
                <div className="modal-infos">
                  <div className="modal-infos">
                    <p>
                      Créé par {matchingUser ? matchingUser.pseudo : ""} le{" "}
                      {dateParser(
                        selectedItemInfo ? selectedItemInfo.createdAt : ""
                      )}
                    </p>
                  </div>
                </div>
              )}
            {!posterId &&
              (userDataId === "65afe8c7c307f521781311fd" ||
                userDataId === "65afe8e4c307f52178131201") && (
                <div className="modal-infos">
                  <div className="modal-infos">
                    <p>Créé par Edith LECORDIER</p>
                  </div>
                </div>
              )}
          </div>

          <div className="modal-right">
            <div className="modal-infos">
              <h4>Dénomination de l'article</h4>
              <p>{selectedItemInfo ? selectedItemInfo.denomination : ""}</p>
            </div>
            <div className="modal-infos">
              <h4>Fournisseur</h4>
              <p>{selectedItemInfo ? selectedItemInfo.fournisseur : ""}</p>
            </div>
            <div className="modal-infos">
              <h4>État de l'article</h4>
              <p>{selectedItemInfo ? selectedItemInfo.etat : ""}</p>
            </div>
            {updateForm !== true && (
              <>
                <div className="modal-infos">
                  <h4>Quantité</h4>
                  <p onClick={() => setUpdateForm(!updateForm)}>
                    {selectedItemInfo ? selectedItemInfo.quantite : ""}
                  </p>
                </div>
                <button
                  onClick={() => setUpdateForm(!updateForm)}
                  className="modal-btn"
                  aria-label="Modifier la quantité"
                >
                  Modifier la quantité
                </button>
              </>
            )}
            {updateForm && (
              <>
                <h4>Quantité</h4>
                <input
                  type="number"
                  min="0"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  className="modal-quantity-input"
                />

                <button
                  onClick={handleUpdate}
                  className="modal-btn"
                  aria-label="Valider modifications"
                >
                  Valider modifications
                </button>
              </>
            )}
            {userDataId === "65afe8c7c307f521781311fd" ||
            userDataId === "65afe8e4c307f52178131201" ? (
              <div className="modal-infos">
                <div className="modal-infos">
                  <p>
                    Modifié par{" "}
                    {selectedItemInfo ? selectedItemInfo.modifierName : ""} le{" "}
                    {dateParser(
                      selectedItemInfo ? selectedItemInfo.updatedAt : ""
                    )}
                  </p>
                </div>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemModale;
