import React from 'react';
import './Delete.css';

const DeleteItem = ({ onDelete }) => {
    return (
      <button onClick={(e) => {
        e.stopPropagation()
        if (window.confirm('Voulez-vous vraiment supprimer cet article ?')) {
          onDelete();
        }
      }} className="item-del" aria-label="Supprimer l'article">
        <i className="fa-solid fa-trash"></i>
      </button>
    );
  };
  
  
export default DeleteItem
