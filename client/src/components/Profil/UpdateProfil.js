import { useDispatch, useSelector } from "react-redux"
import './UpdateProfil.css'
import UploadImg from "./UploadImg"
import { useState } from "react"
import { updateNumero } from "../../actions/user.actions"
import { dateParser } from "../../Utils"

export default function UpdateProfil() {
    const dispatch = useDispatch()
    const userData = useSelector((state) => state.userReducer)
    const [numero, setNumero] = useState('')
    const [updateForm, setUpdateForm] = useState(false)
    const isMenuOpen = useSelector((state) => state.menuReducer.isMenuOpen);

    const handleUpdate = () => {
        dispatch(updateNumero(userData._id, numero))
        setUpdateForm(false)
    }

    return (
        <div className={`profil-ctn main-content ${isMenuOpen ? 'visible' : 'closed'}`}>
            <h1>Profil de {userData.pseudo}</h1>
            <div className="update-ctn">
                <div className="left-part">
                    <h3>Photo de profil</h3>
                    <img src={userData.picture} alt='Employé' />
                    <UploadImg />

                </div>
                <div className="right-part">
                    <h3>Fiche de profil</h3>
                    <h4>Prénom  -  Nom</h4>
                    <p>{userData.pseudo}</p>
                    <h4>Poste au sein de l'entreprise</h4>
                    <p>{userData.poste}</p>
                    <h4>E-mail</h4>
                    <p>{userData.email}</p>
                    {updateForm !== true && (
                        <>
                            <h4>Numéro de téléphone</h4>
                            <p onClick={() => setUpdateForm(!updateForm)}>{userData.numero}</p>
                            <button onClick={() => setUpdateForm(!updateForm)} aria-label="Modifier le numéro">Modifier le numéro</button>
                        </>
                    )}
                    {updateForm && (
                        <>
                            <h4>Numéro de téléphone</h4>
                            <textarea 
                                type='text' 
                                defaultValue={userData.numero} 
                                onChange={(e) => setNumero(e.target.value)}>
                            </textarea>
                            <br/>
                            <button onClick={handleUpdate} aria-label="Valider modifications">Valider modifications</button>
                        </>
                    )}
                    <br/>
                    <h4>Modifié le : {dateParser(userData.updatedAt)}</h4>
                </div>
            </div>
        </div>
    )
}