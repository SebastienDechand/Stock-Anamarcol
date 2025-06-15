import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchArticlesWithLowStock,
  fetchStatistics,
} from "../../actions/statistics.actions";
import "./ArticlesBelow5.css";
import Pagination from "../Pagination/Pagination";

const ArticlesBelow5 = () => {
  const dispatch = useDispatch();
  const rawArticlesWithLowStock = useSelector(
    (state) => state.statisticsReducer.articlesWithLowStock
  );
  const articlesWithLowStock = React.useMemo(
    () => rawArticlesWithLowStock || [],
    [rawArticlesWithLowStock]
  );
  const ITEMS_PER_PAGE = useItemsPerPage();
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = articlesWithLowStock.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  useEffect(() => {
    const fetchArticles = async () => {
      if (!articlesWithLowStock.length) {
        await dispatch(fetchStatistics());
        await dispatch(fetchArticlesWithLowStock());
      }
    };

    fetchArticles();
  }, [dispatch, articlesWithLowStock]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="art5-ctn">
      <h2 className="art5-title">Articles avec un stock inférieur à 5 :</h2>
      {articlesWithLowStock.length !== 0 ? (
        <ul className="art5-ul">
          {currentItems.map((article) => (
            <li key={article._id} className="art5-li">
              {article.quantite < 2 && (
                <span className="badge critical">Critique</span>
              )}
              {article.quantite >= 2 && article.quantite < 5 && (
                <span className="badge medium">Moyen</span>
              )}
              {article.quantite >= 5 && <span className="badge good">OK</span>}

              <img src={article.image} alt="Article" className="art5-img" />
              <h3>{article.denomination}</h3>
              <h4>{article.fournisseur}</h4>
              <p>{article.etat}</p>
              <p className={`${article.quantite >= 5 ? "" : "red"}`}>
                Stock : <strong>{article.quantite}</strong>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun article n'a de stock inférieur à 5.</p>
      )}

      <Pagination
        itemsPerPage={ITEMS_PER_PAGE}
        totalItems={articlesWithLowStock.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
};

// Hook personnalisé pour déterminer le nombre d'articles par page en fonction de la largeur de l'écran
const useItemsPerPage = () => {
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    const handleResize = () => {
      // Ajuste le nombre d'articles par page en fonction de la largeur de l'écran
      if (window.innerWidth < 751) {
        setItemsPerPage(4);
      } else if (window.innerWidth < 1001) {
        setItemsPerPage(3);
      } else if (window.innerWidth < 1251) {
        setItemsPerPage(4);
      } else {
        setItemsPerPage(5);
      }
    };

    // Attache l'événement de redimensionnement du navigateur
    window.addEventListener("resize", handleResize);

    // Appel la fonction de manipulation du redimensionnement au chargement initial
    handleResize();

    // Détache l'événement lors du démontage du composant
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return itemsPerPage;
};

export default ArticlesBelow5;
