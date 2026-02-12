import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchFournisseursList,
  setFournisseurStatistics,
} from "../../actions/statistics.actions";
import "./Statistics.css";

const Statistiques = () => {
  const dispatch = useDispatch();

  const statistics = useSelector((state) => state.statisticsReducer);
  const fournisseursList = statistics?.fournisseursList || [];
  const fournisseursStats = statistics?.fournisseursStats || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchFournisseursList());
      } catch (error) {
        console.error("Error fetching suppliers list:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    const fetchStatistics = async () => {
      for (const fournisseur of fournisseursList) {
        try {
          const responseFournisseur = await axios.get(
            `${import.meta.env.VITE_API_URL}api/statistics/fournisseurs/${fournisseur}`
          );
          const dataFournisseur = responseFournisseur.data;
          dispatch(setFournisseurStatistics(dataFournisseur, fournisseur));
        } catch (error) {
          console.error(`Error fetching statistics for ${fournisseur}:`, error);
        }
      }
    };

    if (fournisseursList.length > 0) {
      fetchStatistics();
    }
  }, [dispatch, fournisseursList]);

  return (
    <div className="stats-container">
      <div className="stats-fournisseurs">
        <h2>Stock par Fournisseur</h2>
        <div className="table-wrapper">
          <table className="suppliers-table">
            <thead>
              <tr>
                <th className="th-supplier">Fournisseur</th>
                <th className="th-data">Articles</th>
                <th className="th-data">Stock total</th>
                <th className="th-data">Stock &lt; 5</th>
              </tr>
            </thead>
            <tbody>
              {fournisseursList.map((fournisseur, index) => (
                <tr key={index} className="tr-supplier">
                  <td className="td-supplier">{fournisseur}</td>
                  <td className="td-number">
                    {fournisseursStats[fournisseur]?.numberOfArticles || 0}
                  </td>
                  <td className="td-number">
                    {fournisseursStats[fournisseur]?.totalStock || 0}
                  </td>
                  <td className="td-number critical">
                    {fournisseursStats[fournisseur]?.numberOfLowStockArticles ||
                      0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;
