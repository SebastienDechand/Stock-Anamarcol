import { useCallback, useState } from "react";
import "./Filtre.css";

const FiltreArticles = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    selectedFournisseurs: [],
    searchTerm: "",
    selectedPrepaCG: false,
    selectedPrepaCaisse: false,
    selectedPrepaTPV: false,
    selectedPreparation: "",
  });

  const updateFilters = (newValues) => {
    const updated = { ...filters, ...newValues };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleFournisseurToggle = useCallback(
    (value) => {
      const updated = filters.selectedFournisseurs.includes(value)
        ? filters.selectedFournisseurs.filter((f) => f !== value)
        : [...filters.selectedFournisseurs, value];
      updateFilters({ selectedFournisseurs: updated });
    },
    [filters.selectedFournisseurs]
  );

  const handleFournisseurSelect = (e) => {
    const value = e.target.value;
    updateFilters({ selectedFournisseurs: value ? [value] : [] });
  };

  const handleSearchChange = (e) => {
    updateFilters({ searchTerm: e.target.value });
  };

  const handlePrepaToggle = (key) => {
    updateFilters({ [key]: !filters[key] });
  };

  const handlePreparationSelect = (e) => {
    const value = e.target.value;
    let newFilters = {
      selectedPreparation: value,
      selectedPrepaCG: false,
      selectedPrepaCaisse: false,
      selectedPrepaTPV: false,
    };

    if (value === "CashGuard") newFilters.selectedPrepaCG = true;
    if (value === "Caisse OHXHOO") newFilters.selectedPrepaCaisse = true;
    if (value === "Caisse TPV") newFilters.selectedPrepaTPV = true;

    updateFilters(newFilters);
  };

  const fournisseursList = [
    "CashGuard",
    "Aures",
    "LDLC",
    "Monétique et Services",
    "Oxhoo",
    "VNE",
    "TPV Line",
    "MD Ouest",
    "Solumag",
    "Tigra",
  ];

  return (
    <div className="filtres">
      {/* Desktop */}
      <div className="tri-ctn desk">
        <h4>Rechercher :</h4>
        <div className="tri-recherche">
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <h4>Fournisseur :</h4>
        <div className="tri-fournisseur">
          {fournisseursList.map((value) => (
            <label key={value}>
              <input
                type="checkbox"
                value={value}
                checked={filters.selectedFournisseurs.includes(value)}
                onChange={() => handleFournisseurToggle(value)}
              />
              {value}
            </label>
          ))}
        </div>

        <h4>Préparation :</h4>
        <div className="tri-prepa">
          <label>
            <input
              type="checkbox"
              checked={filters.selectedPrepaCG}
              onChange={() => handlePrepaToggle("selectedPrepaCG")}
            />
            CashGuard
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.selectedPrepaCaisse}
              onChange={() => handlePrepaToggle("selectedPrepaCaisse")}
            />
            Caisse OHXHOO
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.selectedPrepaTPV}
              onChange={() => handlePrepaToggle("selectedPrepaTPV")}
            />
            Caisse TPV
          </label>
        </div>
      </div>

      {/* Mobile */}
      <div className="tri-ctn mob">
        <div className="tri-recherche">
          <h4>Rechercher :</h4>
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div className="tri-fournisseur">
          <h4>Fournisseur :</h4>
          <select
            value={filters.selectedFournisseurs[0] || ""}
            onChange={handleFournisseurSelect}
          >
            <option value="">-- Fournisseur --</option>
            {fournisseursList.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="tri-prepa">
          <h4>Préparation :</h4>
          <select
            value={filters.selectedPreparation}
            onChange={handlePreparationSelect}
          >
            <option value="">-- Préparation --</option>
            <option value="CashGuard">CashGuard</option>
            <option value="Caisse OHXHOO">Caisse OHXHOO</option>
            <option value="Caisse TPV">Caisse TPV</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FiltreArticles;
