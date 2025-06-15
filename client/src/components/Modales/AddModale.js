import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { addItem } from "../../actions/item.actions";
import "./AddModale.css";

const AddModal = ({ onClose, posterId, modifierId }) => {
  const [denomination, setDenomination] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [quantite, setQuantite] = useState("");
  const [etat, setEtat] = useState("");

  const dispatch = useDispatch();

  const isFormValid = denomination && fournisseur && quantite && etat;

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!isFormValid) return;

    try {
      dispatch(
        addItem({
          denomination,
          fournisseur,
          quantite,
          etat,
          posterId,
          modifierId,
        })
      );

      setDenomination("");
      setFournisseur("");
      setQuantite("");
      setEtat("");
      onClose();
    } catch (error) {
      console.error("Erreur lors de la soumission de l'article", error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content-add">
        <button onClick={onClose} className="modal-close" aria-label="Fermer">
          X
        </button>
        <form
          onSubmit={handleAdd}
          id="article-add-form"
          className="article-add-ctn"
        >
          <label htmlFor="denomination">Dénomination de l'article</label>
          <input
            type="text"
            id="denomination"
            value={denomination}
            onChange={(e) => setDenomination(e.target.value)}
          />

          <label htmlFor="fournisseur">Fournisseur</label>
          <select
            id="fournisseur"
            value={fournisseur}
            onChange={(e) => setFournisseur(e.target.value)}
          >
            <option value="">-- Sélectionner --</option>
            <option value="CashGuard">CashGuard</option>
            <option value="Aures">Aures</option>
            <option value="LDLC">LDLC</option>
            <option value="VNE">VNE</option>
            <option value="TPV Line">TPV Line</option>
            <option value="Oxhoo">Oxhoo</option>
            <option value="Monétique et Services">Monétique et Services</option>
            <option value="MD Ouest">MD Ouest</option>
            <option value="Solumag">Solumag</option>
            <option value="Tigra">Tigra</option>
          </select>

          <label htmlFor="etat">État de l'article</label>
          <select
            id="etat"
            value={etat}
            onChange={(e) => setEtat(e.target.value)}
          >
            <option value="">-- Sélectionner --</option>
            <option value="Neuf">Neuf</option>
            <option value="SAV">SAV</option>
          </select>

          <label htmlFor="quantite">Quantité en stock</label>
          <input
            type="number"
            id="quantite"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            min="0"
            step="1"
            required
          />

          <button type="submit" disabled={!isFormValid}>
            Ajouter l'article
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddModal;
