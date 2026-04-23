import { useEffect, useState, useCallback, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import { fetchItems } from "../../actions/items.actions";
import type { FetchItemsParams } from "../../types";
import {
  deleteItem,
  setSelectedItemId,
  setSelectedItemQuantite,
  updateQuantite,
  prepaBatch,
} from "../../actions/item.actions";
import AddModal from "../../components/Modales/AddModale";
import ItemModale from "../../components/Modales/ItemModale";
import { UidContext } from "../../components/AppContext";
import {
  Search,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Trash2,
  X,
  Loader2,
  Download,
  Sliders,
  Package,
} from "lucide-react";
import ExportOptionsModal from "../../components/Modales/ExportOptionsModal";
import FiltersModal from "../../components/Modales/FiltersModal";
import axios from "axios";
import type { Item, ItemsState, User } from "../../types";
import { FOURNISSEURS, ETATS } from "../../constants";
import { exportItemsToCSV } from "../../utils/csv.utils";

function useResponsiveItemsPerPage() {
  const getCount = () => {
    const w = window.innerWidth;
    if (w < 640) return 8;
    if (w < 768) return 12;
    const h = window.innerHeight;
    let cols: number;
    if (w < 1024) cols = 3;
    else if (w < 1280) cols = 4;
    else if (w < 1536) cols = 5;
    else cols = 6;
    const availableHeight = h - 274;
    const cardHeight = 212;
    const rows = Math.max(1, Math.floor(availableHeight / cardHeight));
    return cols * rows;
  };
  const [count, setCount] = useState(getCount);
  useEffect(() => {
    const onResize = () => setCount(getCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return count;
}

export default function Articles() {
  const dispatch = useAppDispatch();
  const authContext = useContext(UidContext);
  const isAdmin = authContext?.isAdmin;
  const userPseudo = useSelector(
    (state: { userReducer: Partial<User> }) => state.userReducer.pseudo,
  );
  const userId = useSelector(
    (state: { userReducer: Partial<User> }) => state.userReducer._id,
  );

  const {
    items: pageItems,
    totalPages,
    isLoading,
    canDecrement,
  } = useSelector((state: { itemsReducer: ItemsState }) => state.itemsReducer);
  const itemsPerPage = useResponsiveItemsPerPage();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fournisseurFilter, setFournisseurFilter] = useState<string[]>([]);
  const [etatFilter, setEtatFilter] = useState<string[]>([]);
  const [prepaFilter, setPrepaFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    fournisseurFilter,
    etatFilter,
    prepaFilter,
    itemsPerPage,
  ]);

  // Build fetch params
  const fetchParams = useMemo<FetchItemsParams>(() => {
    const params: FetchItemsParams = {
      page: currentPage,
      limit: itemsPerPage,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (fournisseurFilter.length) params.fournisseur = fournisseurFilter;
    if (etatFilter.length) params.etat = etatFilter;
    if (prepaFilter.includes("CashGuard")) params.prepaCG = true;
    if (prepaFilter.includes("Caisse TPV")) params.prepaTPV = true;
    return params;
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearch,
    fournisseurFilter,
    etatFilter,
    prepaFilter,
  ]);

  // Fetch items from server whenever params change
  useEffect(() => {
    dispatch(fetchItems(fetchParams));
  }, [dispatch, fetchParams]);

  const refetchItems = useCallback(() => {
    dispatch(fetchItems(fetchParams));
  }, [dispatch, fetchParams]);

  const toggleFournisseur = useCallback((f: string) => {
    setFournisseurFilter((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f],
    );
  }, []);

  const toggleEtat = useCallback((e: string) => {
    setEtatFilter((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
    );
  }, []);

  const PREPARATIONS = ["CashGuard", "Caisse TPV"] as const;
  const PREPA_FIELD_MAP: Record<string, string> = {
    CashGuard: "prepaCG",
    "Caisse TPV": "prepaTPV",
  };
  const [prepaBatchLoading, setPrepaBatchLoading] = useState<string | null>(
    null,
  );
  const [prepaCount, setPrepaCount] = useState<number>(1);

  const togglePrepa = useCallback((p: string) => {
    setPrepaFilter((prev) => (prev.includes(p) ? [] : [p]));
  }, []);

  const handlePrepaBatch = async (
    prepaLabel: string,
    operation: "increment" | "decrement",
    count: number = 1,
  ) => {
    const field = PREPA_FIELD_MAP[prepaLabel];
    if (!field) return;
    setPrepaBatchLoading(`${field}-${operation}`);
    try {
      await dispatch(prepaBatch(field, operation, count));
      dispatch(fetchItems(fetchParams));
      if (operation === "increment") setPrepaCount(1);
    } catch (err) {
      console.error(err);
    } finally {
      setPrepaBatchLoading(null);
    }
  };

  const handleQuantityChange = (
    e: React.MouseEvent,
    itemId: string,
    operation: string,
  ) => {
    e.stopPropagation();
    const item = pageItems.find((i: Item) => i._id === itemId);
    if (!item) return;
    const qty = Number(item.quantite);
    const newQty = operation === "increment" ? qty + 1 : qty - 1;
    if (newQty < 0) return;
    dispatch(updateQuantite(itemId, newQty, userPseudo || "", operation));
  };

  const handleDelete = (itemId: string, fournisseur: string, etat: string) => {
    dispatch(deleteItem(itemId, fournisseur, etat));
    setDeleteConfirmId(null);
  };

  const handleItemClick = (itemId: string) => {
    dispatch(setSelectedItemId(itemId));
    setIsItemModalOpen(true);
  };

  const handleExportCSV = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}api/item/?limit=9999`,
    );
    const data = res.data;
    const all: Item[] = Array.isArray(data) ? data : data.items || [];
    exportItemsToCSV(all);
  };

  const closeItemModal = () => {
    dispatch(setSelectedItemId(null));
    dispatch(setSelectedItemQuantite(null));
    setIsItemModalOpen(false);
    refetchItems();
  };

  const getBadge = (qty: number | string) => {
    const q = Number(qty);
    if (q <= 2)
      return (
        <span className="absolute top-1.5 left-1.5 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
          Urgent
        </span>
      );
    if (q < 5)
      return (
        <span className="absolute top-1.5 left-1.5 z-10 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
          Limite
        </span>
      );
    return (
      <span className="absolute top-1.5 left-1.5 z-10 bg-brand-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
        OK
      </span>
    );
  };

  return (
    <div>
      {/* Toolbar + Filters */}
      <div className="shrink-0 bg-gray-200/95 backdrop-blur-sm pb-2 space-y-1 -mx-2 px-2 pt-0 mb-2 md:-mx-3 md:px-3 lg:-mx-4 lg:px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package size={20} className="text-brand-600 shrink-0" />
              Articles
            </h1>
            <p className="text-sm text-gray-600 mt-1">Gestion du stock et des équipements</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher un article..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                title="Filtres"
                onClick={() => setIsFiltersModalOpen(true)}
                className="sm:hidden relative flex items-center justify-center p-2 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg border border-gray-200 transition-colors shrink-0"
              >
                <Sliders size={18} />
                <span className="sr-only">Filtres</span>
                {(debouncedSearch ||
                  fournisseurFilter.length > 0 ||
                  etatFilter.length > 0 ||
                  prepaFilter.length > 0) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              {isAdmin && (
                <>
                  <button
                    title="Exporter"
                    onClick={() => setIsExportModalOpen(true)}
                    className="flex items-center justify-center p-2 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-200 transition-colors shrink-0"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    title="Ajouter"
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
                  >
                    <PlusCircle size={16} />
                    Ajouter
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden sm:flex gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible items-center">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
            Fournisseurs
          </span>
          {FOURNISSEURS.map((f) => (
            <button
              key={f}
              onClick={() => toggleFournisseur(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                fournisseurFilter.includes(f)
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              title={`Filtrer par ${f}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible items-center">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
            État
          </span>
          {ETATS.map((e) => (
            <button
              key={e}
              onClick={() => toggleEtat(e)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                etatFilter.includes(e)
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              title={`Filtrer état ${e}`}
            >
              {e}
            </button>
          ))}
          <span className="w-px bg-gray-300 mx-1 self-stretch shrink-0" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
            Prépa
          </span>
          {PREPARATIONS.map((p) => (
            <button
              key={p}
              onClick={() => togglePrepa(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                prepaFilter.includes(p)
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              title={`Filtrer préparation ${p}`}
            >
              {p}
            </button>
          ))}
          {(fournisseurFilter.length > 0 ||
            etatFilter.length > 0 ||
            prepaFilter.length > 0) && (
            <button
              onClick={() => {
                setFournisseurFilter([]);
                setEtatFilter([]);
                setPrepaFilter([]);
              }}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors shrink-0 ml-auto"
              title="Effacer les filtres"
            >
              <X size={12} />
              Tout effacer
            </button>
          )}
        </div>

        {/* Prepa filters always visible on mobile, plus visible & styled */}
        <div className="flex sm:hidden gap-2 overflow-x-auto no-scrollbar items-center mt-2 mb-3 px-2 py-2 bg-violet-50 border border-violet-200 rounded-lg shadow-sm justify-center w-full">
          <span className="text-[10px] font-bold text-violet-700 uppercase tracking-wide shrink-0">
            Prépa
          </span>
          {PREPARATIONS.map((p) => (
            <button
              key={p}
              onClick={() => togglePrepa(p)}
              className={`px-4 py-1 rounded-full text-xs font-semibold border-2 transition-colors shrink-0 shadow-sm ${
                prepaFilter.includes(p)
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-violet-700 border-violet-300 hover:bg-violet-100"
              }`}
              style={{ minWidth: 80 }}
            >
              {p}
            </button>
          ))}
          {prepaFilter.length > 0 && (
            <button
              onClick={() => setPrepaFilter([])}
              className="p-1 rounded-full text-violet-500 hover:text-violet-700 hover:bg-violet-200 transition-colors shrink-0"
              title="Effacer la sélection"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Prepa action bar */}
      {prepaFilter.length > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-2 py-2.5 flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <span className="hidden sm:inline text-sm text-violet-800">
            Prépa{" "}
            <span className="font-semibold">{prepaFilter.join(", ")}</span>
          </span>
          <div className="flex flex-row items-start gap-4 w-full sm:w-auto sm:flex-row sm:items-stretch sm:gap-0 sm:divide-x sm:divide-violet-200">
            {/* Retirer du stock */}
            <div className="flex flex-col items-center w-full sm:w-64 md:w-72 px-0 sm:px-4 mt-0">
              <div className="flex flex-col items-center sm:flex-row sm:items-center w-full">
                <input
                  type="number"
                  value={1}
                  disabled
                  className="w-20 px-1.5 py-1.5 text-xs text-center border border-violet-200 rounded-lg bg-gray-100 text-gray-400 mb-1 sm:mb-0 sm:mr-2 cursor-not-allowed"
                  style={{ minWidth: "56px" }}
                  aria-label="Quantité à retirer"
                />
                <span className="text-[10px] text-gray-400 font-normal mb-2 text-center sm:hidden">
                  (1 à la fois)
                </span>
                <button
                  onClick={() => {
                    for (const p of prepaFilter)
                      handlePrepaBatch(p, "decrement");
                  }}
                  disabled={
                    prepaBatchLoading !== null ||
                    prepaFilter.some((p) => {
                      const field = PREPA_FIELD_MAP[p];
                      return field ? canDecrement?.[field] === false : false;
                    })
                  }
                  title={
                    prepaFilter.some((p) => {
                      const field = PREPA_FIELD_MAP[p];
                      return field ? canDecrement?.[field] === false : false;
                    })
                      ? "Stock insuffisant pour certains articles de la prépa"
                      : undefined
                  }
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-auto sm:flex-1 justify-center shadow-sm whitespace-nowrap"
                >
                  <Minus size={14} />
                  {prepaBatchLoading?.endsWith("-decrement")
                    ? "En cours…"
                    : "Retirer du stock"}
                </button>
              </div>
            </div>
            {/* Ajouter en stock */}
            <div className="flex flex-col items-center w-full sm:w-64 md:w-72 px-0 sm:px-4 mt-0">
              <div className="flex flex-col items-center sm:flex-row sm:items-center w-full">
                <input
                  id="prepaCountInput"
                  type="number"
                  min={1}
                  value={prepaCount}
                  onChange={(e) =>
                    setPrepaCount(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 px-1.5 py-1.5 text-xs text-center border border-violet-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 mb-1 sm:mb-0 sm:mr-2"
                  title="Nombre à ajouter en stock"
                  style={{ minWidth: "56px" }}
                />
                <span className="text-[10px] text-gray-400 font-normal mb-2 text-center sm:hidden">
                  (Entrer la quantité)
                </span>
                <button
                  onClick={() => {
                    for (const p of prepaFilter)
                      handlePrepaBatch(p, "increment", prepaCount);
                  }}
                  disabled={prepaBatchLoading !== null}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white text-violet-700 text-xs font-semibold rounded-lg border border-violet-300 hover:bg-violet-100 transition-colors disabled:opacity-50 w-auto sm:flex-1 justify-center shadow-sm whitespace-nowrap"
                >
                  <Plus size={14} />
                  {prepaBatchLoading?.endsWith("-increment")
                    ? "En cours…"
                    : "Remettre en stock"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-brand-600" />
        </div>
      )}

      {/* Items grid */}
      {!isLoading && pageItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3">
          {pageItems.map((item: Item) => (
            <div
              key={item._id}
              onClick={() => handleItemClick(item._id)}
              className="relative bg-white rounded-xl overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group ring-1 ring-black/[0.04] flex flex-col min-h-0"
            >
              <div className="relative h-32 bg-white flex items-center justify-center p-3">
                {getBadge(item.quantite)}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(
                        deleteConfirmId === item._id ? null : item._id,
                      );
                    }}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-50 backdrop-blur rounded-full text-red-400 hover:text-white hover:bg-red-500 transition-all z-10"
                    title="Supprimer l'article"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <img
                  src={item.image}
                  alt={item.denomination}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {deleteConfirmId === item._id && (
                <div
                  className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2 rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="text-xs font-medium text-gray-700">
                    Supprimer ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleDelete(item._id, item.fournisseur, item.etat)
                      }
                      className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-medium rounded-md hover:bg-red-700"
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[11px] font-medium rounded-md hover:bg-gray-200"
                    >
                      Non
                    </button>
                  </div>
                </div>
              )}

              <div className="px-2 py-1.5 border-t border-gray-200/60 bg-gray-50 mt-auto">
                <div className="min-w-0 mb-1">
                  <h3 className="text-[11px] font-semibold text-gray-900 truncate leading-tight">
                    {item.denomination}
                  </h3>
                  <p className="text-[10px] text-gray-400 truncate">
                    {item.fournisseur} &middot; {item.etat}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) =>
                      handleQuantityChange(e, item._id, "decrement")
                    }
                    className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-gray-200/80 text-gray-500 hover:bg-red-500 hover:text-white active:bg-red-600 transition-colors"
                    title="Diminuer la quantité"
                  >
                    <Minus size={14} className="sm:w-3 sm:h-3 w-4 h-4" />
                  </button>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      Number(item.quantite) < 5
                        ? "text-red-600"
                        : "text-gray-900"
                    }`}
                  >
                    {item.quantite}
                  </span>
                  <button
                    onClick={(e) =>
                      handleQuantityChange(e, item._id, "increment")
                    }
                    className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-full bg-gray-200/80 text-gray-500 hover:bg-brand-600 hover:text-white active:bg-brand-700 transition-colors"
                    title="Augmenter la quantité"
                  >
                    <Plus size={14} className="sm:w-3 sm:h-3 w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && pageItems.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          Aucun article ne correspond à vos critères.
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Page précédente"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
            )
            .reduce<(number | string)[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "..." ? (
                <span key={`dot-${i}`} className="px-1 text-gray-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === p
                      ? "bg-brand-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title={`Aller à la page ${p}`}
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Page suivante"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      {isAddModalOpen && userId && (
        <AddModal
          onClose={() => {
            setIsAddModalOpen(false);
            refetchItems();
          }}
          posterId={userId}
          modifierId={userId}
        />
      )}
      {isItemModalOpen && <ItemModale onClose={closeItemModal} />}
      {isExportModalOpen && (
        <ExportOptionsModal onClose={() => setIsExportModalOpen(false)} />
      )}
      {isFiltersModalOpen && (
        <FiltersModal
          onClose={() => setIsFiltersModalOpen(false)}
          search={search}
          fournisseurFilter={fournisseurFilter}
          etatFilter={etatFilter}
          prepaFilter={prepaFilter}
          onApply={(s, f, e, p) => {
            setSearch(s);
            setFournisseurFilter(f);
            setEtatFilter(e);
            setPrepaFilter(p);
          }}
        />
      )}
    </div>
  );
}
