import { useEffect, useState } from "react";
import axios from "axios";
import {
  Package,
  Warehouse,
  Truck,
  AlertTriangle,
  TrendingDown,
  PieChartIcon,
  BarChart3,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#16a34a",
  "#2563eb",
  "#d97706",
  "#9333ea",
  "#dc2626",
  "#0891b2",
  "#be185d",
  "#65a30d",
  "#ea580c",
  "#4f46e5",
];

function KpiCard({ icon: Icon, label, value, accent = "brand" }) {
  const accents = {
    brand: "bg-brand-50 text-brand-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div
        className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg shrink-0 ${accents[accent]}`}
      >
        <Icon className="w-4 h-4 sm:w-[22px] sm:h-[22px]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
          {label}
        </p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900">
          {value ?? "–"}
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stockTab, setStockTab] = useState("all");
  const [chartType, setChartType] = useState("pie"); // "pie" | "bar"

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}api/statistics/dashboard`, {
        withCredentials: true,
      })
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Dashboard stats error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-brand-500" />
      </div>
    );
  }

  const g = stats?.global || {};
  const fournisseurs = stats?.fournisseurs || [];
  const lowStockItems = stats?.lowStockItems || [];
  const filteredLowStock =
    stockTab === "all"
      ? lowStockItems
      : lowStockItems.filter((i) => i.etat === stockTab);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <KpiCard
          icon={Package}
          label="Nombre d'articles"
          value={g.numberOfArticles}
          accent="brand"
        />
        <KpiCard
          icon={Warehouse}
          label="Stock total"
          value={g.totalStock}
          accent="blue"
        />
        <KpiCard
          icon={Truck}
          label="Fournisseurs"
          value={g.numberOfSuppliers}
          accent="amber"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Stock < 5"
          value={g.numberOfLowStockArticles}
          accent="red"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pie/Bar chart — stock par fournisseur */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              Stock par fournisseur
            </h2>
            {/* Toggle pie/bar — desktop only */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartType("pie")}
                className={`p-1.5 rounded-md transition-colors ${
                  chartType === "pie"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Camembert"
              >
                <PieChartIcon size={16} />
              </button>
              <button
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-md transition-colors ${
                  chartType === "bar"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Graphique barres"
              >
                <BarChart3 size={16} />
              </button>
            </div>
          </div>
          {fournisseurs.length > 0 ? (
            <>
              {/* Mobile: always pie chart */}
              <div className="md:hidden">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={fournisseurs}
                      dataKey="totalStock"
                      nameKey="nom"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={100}
                      paddingAngle={2}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        percent,
                      }) => {
                        if (percent < 0.04) return null;
                        const RADIAN = Math.PI / 180;
                        const radius =
                          innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={11}
                            fontWeight={600}
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                    >
                      {fournisseurs.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} unités`, name]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Desktop: pie or bar based on toggle */}
              <div className="hidden md:block">
                {chartType === "pie" ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={fournisseurs}
                        dataKey="totalStock"
                        nameKey="nom"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={100}
                        paddingAngle={2}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                        }) => {
                          if (percent < 0.04) return null;
                          const RADIAN = Math.PI / 180;
                          const radius =
                            innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="white"
                              textAnchor="middle"
                              dominantBaseline="central"
                              fontSize={11}
                              fontWeight={600}
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                        labelLine={false}
                      >
                        {fournisseurs.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} unités`, name]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={fournisseurs}
                      margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="nom"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickLine={false}
                        axisLine={{ stroke: "#e5e7eb" }}
                        interval={0}
                        angle={-25}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        tickLine={false}
                        axisLine={{ stroke: "#e5e7eb" }}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} unités`,
                          "Stock",
                        ]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Bar dataKey="totalStock" radius={[4, 4, 0, 0]}>
                        {fournisseurs.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                {fournisseurs.map((f, i) => (
                  <div key={f.nom} className="flex items-center gap-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                    <span className="text-xs text-gray-600">{f.nom}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">Aucune donnée</p>
          )}
        </div>

        {/* Fournisseurs details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            Détails fournisseurs
          </h2>
          {/* Mobile card view */}
          <div className="md:hidden space-y-2">
            {fournisseurs.map((f) => (
              <div key={f.nom} className="bg-gray-50/80 rounded-lg px-3 py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-800 text-sm">
                    {f.nom}
                  </span>
                  <span
                    className={`inline-block min-w-[20px] text-center font-semibold rounded-full px-1.5 py-0.5 text-xs ${
                      f.numberOfLowStockArticles > 0
                        ? "bg-red-50 text-red-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    {f.numberOfLowStockArticles}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{f.numberOfArticles} articles</span>
                  <span>Stock : {f.totalStock}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pl-2 font-medium text-gray-500">
                    Fournisseur
                  </th>
                  <th className="text-right py-2 font-medium text-gray-500">
                    Articles
                  </th>
                  <th className="text-right py-2 font-medium text-gray-500">
                    Stock
                  </th>
                  <th className="text-right py-2 pr-2 font-medium text-gray-500">
                    Stock &lt; 5
                  </th>
                </tr>
              </thead>
              <tbody>
                {fournisseurs.map((f) => (
                  <tr
                    key={f.nom}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="py-2.5 pl-2 font-medium text-gray-800">
                      {f.nom}
                    </td>
                    <td className="py-2.5 text-right text-gray-600">
                      {f.numberOfArticles}
                    </td>
                    <td className="py-2.5 text-right text-gray-600">
                      {f.totalStock}
                    </td>
                    <td className="py-2.5 text-right pr-2">
                      <span
                        className={`inline-block min-w-[24px] text-center font-semibold rounded-full px-2 py-0.5 text-xs ${
                          f.numberOfLowStockArticles > 0
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        {f.numberOfLowStockArticles}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Low stock items with SAV/Neuf tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown size={18} className="text-red-500" />
            <h2 className="text-base font-semibold text-gray-800">
              Articles en stock critique (&lt; 5)
            </h2>
          </div>
          {/* Tabs SAV / Neuf */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: "all", label: "Tous" },
              { key: "SAV", label: "SAV" },
              { key: "Neuf", label: "Neuf" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStockTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  stockTab === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.key !== "all" && (
                  <span className="ml-1 text-[10px] opacity-60">
                    ({lowStockItems.filter((i) => i.etat === tab.key).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        {filteredLowStock.length > 0 ? (
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-2">
              {filteredLowStock.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between bg-gray-50/80 rounded-lg px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {item.denomination}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.fournisseur} · {item.etat}
                    </p>
                  </div>
                  <span
                    className={`inline-block min-w-[24px] text-center rounded-full px-2 py-0.5 text-xs font-bold shrink-0 ${
                      item.quantite < 2
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.quantite}
                  </span>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pl-2 font-medium text-gray-500">
                      Dénomination
                    </th>
                    <th className="text-left py-2 font-medium text-gray-500">
                      Fournisseur
                    </th>
                    <th className="text-left py-2 font-medium text-gray-500">
                      État
                    </th>
                    <th className="text-right py-2 pr-2 font-medium text-gray-500">
                      Quantité
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLowStock.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-2.5 pl-2 font-medium text-gray-800">
                        {item.denomination}
                      </td>
                      <td className="py-2.5 text-gray-600">
                        {item.fournisseur}
                      </td>
                      <td className="py-2.5 text-gray-600">{item.etat}</td>
                      <td className="py-2.5 text-right pr-2">
                        <span
                          className={`inline-block min-w-[24px] text-center rounded-full px-2 py-0.5 text-xs font-bold ${
                            item.quantite < 2
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.quantite}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">
            Aucun article en stock critique
            {stockTab !== "all" ? ` (${stockTab})` : ""}.
          </p>
        )}
      </div>
    </div>
  );
}
