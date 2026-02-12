import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import {
  deleteItem,
  setSelectedItemId,
  setSelectedItemQuantite,
  updateQuantite,
} from "../../actions/item.actions";
import Pagination from "../../components/Pagination/Pagination";
import DeleteItem from "../Delete/Delete";
import ItemModale from "../Modales/ItemModale";
import "./AllArticles.css";
import type { Item, Filters } from "../../types";

interface AllArticlesProps {
  filteredItems: Item[];
  setFilteredItems: React.Dispatch<React.SetStateAction<Item[]>>;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  currentFilters: Filters;
}

const AllArticles = ({
  filteredItems,
  setFilteredItems,
  currentPage,
  setCurrentPage,
  currentFilters,
}: AllArticlesProps) => {
  const dispatch = useAppDispatch();
  const itemsData = useSelector(
    (state: { itemsReducer: { items: Item[] } }) =>
      state.itemsReducer.items || [],
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const selectedItemId = useSelector(
    (state: { itemReducer: { selectedItemId: string | null } }) =>
      state.itemReducer.selectedItemId,
  );
  const userDataPseudo = useSelector(
    (state: { userReducer: { pseudo?: string } }) => state.userReducer.pseudo,
  );
  const userDataId = useSelector(
    (state: { userReducer: { _id?: string } }) => state.userReducer._id,
  );

  const ITEMS_PER_PAGE = useItemsPerPage();

  useEffect(() => {
    const newFilteredItems = itemsData.filter((item) => {
      const fournisseurMatch =
        currentFilters.selectedFournisseurs.length === 0 ||
        currentFilters.selectedFournisseurs.includes(item.fournisseur);
      const searchTermMatch =
        !currentFilters.searchTerm ||
        item.denomination
          .toLowerCase()
          .includes(currentFilters.searchTerm.toLowerCase());
      const prepaCGMatch =
        !currentFilters.selectedPrepaCG ||
        item.prepaCG === currentFilters.selectedPrepaCG;
      const prepaCaisseMatch =
        !currentFilters.selectedPrepaCaisse ||
        item.prepaCaisse === currentFilters.selectedPrepaCaisse;
      const prepaTPVMatch =
        !currentFilters.selectedPrepaTPV ||
        item.prepaTPV === currentFilters.selectedPrepaTPV;
      const preparationMatch =
        !currentFilters.selectedPreparation ||
        item.preparation === currentFilters.selectedPreparation;

      return (
        fournisseurMatch &&
        searchTermMatch &&
        prepaCGMatch &&
        prepaCaisseMatch &&
        prepaTPVMatch &&
        preparationMatch
      );
    });

    setFilteredItems(newFilteredItems);
    setCurrentPage(1);
  }, [currentFilters]);

  useEffect(() => {
    setFilteredItems((prevFilteredItems) => {
      const newFiltered = itemsData.filter((item) =>
        prevFilteredItems.some((i) => i._id === item._id),
      );
      return newFiltered;
    });
  }, [itemsData]);

  const currentItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleItemClick = (itemId: string, isDeleteButton?: boolean) => {
    if (!isDeleteButton) {
      dispatch(setSelectedItemId(itemId));
      setIsAddModalOpen(true);
    }
  };

  const getStockBadge = (qty: number) => {
    if (qty <= 2) return { label: "Urgent", className: "badge urgent" };
    if (qty < 5) return { label: "Limite", className: "badge medium" };
    return { label: "OK", className: "badge good" };
  };

  const closeAddModal = () => {
    dispatch(setSelectedItemId(null));
    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (
    itemId: string,
    fournisseur: string,
    etat: string,
  ) => {
    dispatch(deleteItem(itemId, fournisseur, etat));
    const updatedFilteredItems = filteredItems.filter(
      (item) => item._id !== itemId,
    );
    setFilteredItems(updatedFilteredItems);
    dispatch(setSelectedItemQuantite(null));
  };

  const handleQuantityChange = (
    e: React.MouseEvent,
    itemId: string,
    operation: string,
  ) => {
    e.stopPropagation();
    const selectedItem = filteredItems.find((item) => item._id === itemId);

    if (selectedItem && userDataPseudo) {
      const numericQuantite = parseInt(String(selectedItem.quantite), 10);

      if (operation === "increment") {
        dispatch(
          updateQuantite(
            itemId,
            numericQuantite + 1,
            userDataPseudo,
            "increment",
          ),
        );
      } else if (operation === "decrement") {
        dispatch(
          updateQuantite(
            itemId,
            numericQuantite - 1,
            userDataPseudo,
            "decrement",
          ),
        );
      } else {
        dispatch(updateQuantite(itemId, 15, userDataPseudo, "direct"));
      }
    }
  };

  return (
    <div className="item-flex">
      <p className="article-error"></p>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="items-ctn"
      >
        <AnimatePresence>
          {filteredItems.length > 0 && (
            <ul className="all-items">
              {currentItems.map((item) => (
                <motion.li
                  key={item._id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleItemClick(item._id)}
                >
                  {(() => {
                    const badge = getStockBadge(item.quantite);
                    return (
                      <span className={badge.className}>{badge.label}</span>
                    );
                  })()}
                  {userDataId === "65afe8c7c307f521781311fd" ||
                  userDataId === "65afe8e4c307f52178131201" ? (
                    <DeleteItem
                      onDelete={() =>
                        handleDeleteItem(item._id, item.fournisseur, item.etat)
                      }
                    />
                  ) : (
                    ""
                  )}
                  <img src={item.image} alt="Article" className="item-img" />
                  <h3>{item.denomination}</h3>
                  <h4>{item.fournisseur}</h4>
                  <p>{item.etat}</p>
                  <div className="items-quantity">
                    <button
                      className="plus-btn"
                      onClick={(e) =>
                        handleQuantityChange(e, item._id, "decrement")
                      }
                      aria-label="Retirer"
                    >
                      -
                    </button>
                    <p
                      className={`${
                        item.quantite >= 5
                          ? "item-quantite"
                          : "red item-quantite"
                      }`}
                    >
                      Stock : {item.quantite}
                    </p>
                    <button
                      className="minus-btn"
                      onClick={(e) =>
                        handleQuantityChange(e, item._id, "increment")
                      }
                      aria-label="Ajouter"
                    >
                      +
                    </button>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
          {filteredItems.length === 0 && (
            <p>Aucun article ne correspond à vos filtres.</p>
          )}
        </AnimatePresence>

        {isAddModalOpen && <ItemModale onClose={closeAddModal} />}

        <div className="pagination-container">
          <Pagination
            itemsPerPage={ITEMS_PER_PAGE}
            totalItems={filteredItems.length}
            paginate={paginate}
            currentPage={currentPage}
          />
        </div>
      </motion.div>
    </div>
  );
};

const useItemsPerPage = (): number => {
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1500) {
        setItemsPerPage(8);
      } else if (window.innerWidth <= 1400) {
        setItemsPerPage(6);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return itemsPerPage;
};

export default AllArticles;
