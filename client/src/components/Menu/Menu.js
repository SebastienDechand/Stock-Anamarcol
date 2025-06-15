import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AddModal from '../Modales/AddModale';
import './Menu.css';
import { useDispatch, useSelector } from 'react-redux';
import FiltreArticles from '../Filtre/Filtre';
import AllArticles from '../Articles/AllArticles';
import { toggleMenu } from '../../actions/menu.action';

export default function Menu() {
  const location = useLocation();
  const dispatch = useDispatch();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const currentUser = useSelector((state) => state.userReducer)
  const itemsData = useSelector((state) => state.itemsReducer.items || []);
  const [filteredItems, setFilteredItems] = useState(itemsData);
  const [currentPage, setCurrentPage] = useState(1);
  const isMenuOpen = useSelector((state) => state.menuReducer.isMenuOpen);

  const [currentFilters, setCurrentFilters] = useState({
    selectedFournisseurs: [],
    // selectedEtats: [],
    searchTerm: '',
    selectedPrepaCG: [],
    selectedPrepaCaisse: [],
    selectedPrepaTPV: [],
  });

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };
  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };
  const handleMenuToggle = () => {
    dispatch(toggleMenu()); 
  };

  const isOnArticlePage = location.pathname === '/articles';

  const handleFilterChange = ({ selectedFournisseurs, searchTerm, selectedPrepaCG, selectedPrepaCaisse, selectedPrepaTPV}) => {
    setCurrentFilters({ selectedFournisseurs, searchTerm, selectedPrepaCG, selectedPrepaCaisse, selectedPrepaTPV});
  };

  return (
    <div className='menu-all'>
      <div className={`menu-ctn ${isMenuOpen ? 'visible' : 'closed'}`}> 
        <ul className='menu-list'>
          <li>
            <Link to='/home'>
              <i className="fa-solid fa-house"></i>
              Accueil
            </Link>
          </li>

          {isOnArticlePage ? (
            <>
              <li>
                <Link to='/articles'>
                  <i className="fa-solid fa-bag-shopping"></i>
                  Articles
                </Link>
              </li>
              <li className='li-btn desk'>
                <button onClick={openAddModal} aria-label="Ajouter article(s)">
                  Ajouter article(s)
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to='/articles'>
                <i className="fa-solid fa-bag-shopping"></i>
                Articles
              </Link>
            </li>
          )}

          <li>
            <Link to='/membres'>
              <i className="fa-solid fa-user"></i>
              Membres
            </Link>
          </li>

          <li>
            <Link to='/contacts'>
              <i className="fa-solid fa-user"></i>
              Contacts
            </Link>
          </li>
        </ul>

        {isOnArticlePage && <FiltreArticles onFilterChange={handleFilterChange} currentFilters={currentFilters}/>}
      </div>

      <button onClick={handleMenuToggle} className={`toggle-menu-button ${isMenuOpen ? '' : 'sticky'}`}>
        {isMenuOpen ? (
          <i className="fa-solid fa-chevron-left"></i>)
          : (
          <i className="fa-solid fa-chevron-right"></i>
        )}
      </button>

      {isAddModalOpen && currentUser._id && (
          <AddModal onClose={closeAddModal} posterId={currentUser._id} modifierId={currentUser._id} />
      )}

      <div className='main-content'>
        {isOnArticlePage && (
          <>
            <button onClick={openAddModal} aria-label="Ajouter article(s)" className='add-btn mob'>
              Ajouter article(s)
            </button>
            <AllArticles
              filteredItems={filteredItems}
              setFilteredItems={setFilteredItems}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              currentFilters={currentFilters}
            />
          </>
        )}
      </div>

    </div>
  );
}
