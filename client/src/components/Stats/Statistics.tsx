import axios from "axios";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import {
  fetchSuppliersList,
  setSupplierStatistics,
} from "../../actions/statistics.actions";
import "./Statistics.css";
import type { StatisticsState, SupplierStats } from "../../types";

const Statistiques = () => {
  const dispatch = useAppDispatch();

  const statistics = useSelector(
    (state: { statisticsReducer: StatisticsState }) => state.statisticsReducer,
  );
  const suppliersList = statistics?.suppliersList || [];
  const suppliersStats = statistics?.suppliersStats || {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchSuppliersList());
      } catch (error) {
        console.error("Error fetching suppliers list:", error);
      }
    };

    fetchData();
  }, [dispatch]);

  useEffect(() => {
    const fetchStatistics = async () => {
      for (const supplier of suppliersList) {
        try {
          const responseSupplier = await axios.get(
            `${import.meta.env.VITE_API_URL}api/statistics/suppliers/${supplier}`,
          );
          const dataSupplier = responseSupplier.data as SupplierStats;
          dispatch(setSupplierStatistics(dataSupplier, supplier));
        } catch (error) {
          console.error(`Error fetching statistics for ${supplier}:`, error);
        }
      }
    };

    if (suppliersList.length > 0) {
      fetchStatistics();
    }
  }, [dispatch, suppliersList]);

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
              {suppliersList.map((supplier: string, index: number) => (
                <tr key={index} className="tr-supplier">
                  <td className="td-supplier">{supplier}</td>
                  <td className="td-number">
                    {suppliersStats[supplier]?.numberOfArticles || 0}
                  </td>
                  <td className="td-number">
                    {suppliersStats[supplier]?.totalStock || 0}
                  </td>
                  <td className="td-number critical">
                    {suppliersStats[supplier]?.numberOfLowStockArticles ||
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
