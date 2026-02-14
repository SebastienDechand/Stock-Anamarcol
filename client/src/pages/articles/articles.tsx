import { useEffect, useState, useCallback, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../hooks/redux";
import { fetchItems } from "../../actions/items.actions";
import type { FetchItemsParams } from "../../actions/items.actions";
import {
  deleteItem,
  setSelectedItemId,
  setSelectedItemQuantite,
  updateQuantite,
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
} from "lucide-react";
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

  const { items: pageItems, totalPages, isLoading } = useSelector(
    (state: { itemsReducer: ItemsState }) => state.itemsReducer,
  );
  const itemsPerPage = useResponsiveItemsPerPage();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fournisseurFilter, setFournisseurFilter] = useState<string[]>([]);
  const [etatFilter, setEtatFilter] = useState<string[]>([]);
  const [prepaFilter, setPrepaFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, fournisseurFilter, etatFilter, prepaFilter, itemsPerPage]);

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
    if (prepaFilter.includes("Caisse OHXHOO")) params.prepaCaisse = true;
    if (prepaFilter.includes("Caisse TPV")) params.prepaTPV = true;
    return params;
  }, [currentPage, itemsPerPage, debouncedSearch, fournisseurFilter, etatFilter, prepaFilter]);

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

  const PREPARATIONS = ["CashGuard", "Caisse OHXHOO", "Caisse TPV"] as const;

  const togglePrepa = useCallback((p: string) => {
    setPrepaFilter((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }, []);

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
      <div className="shrink-0 bg-gray-200/95 backdrop-blur-sm pb-1 space-y-1 -mx-2 px-2 pt-0 mb-1 sm:pb-2 sm:space-y-2 sm:pt-2 sm:mb-2 md:-mx-3 md:px-3 md:pt-3 md:mb-3 lg:-mx-4 lg:px-4 lg:pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
          <h1 className="text-lg font-bold text-gray-900">Articles</h1>
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
            {isAdmin && (
              <>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg border border-gray-200 transition-colors shrink-0"
                >
                  <Download size={16} />
                  Export
                </button>
                <button
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

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible items-center">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">Fournisseurs</span>
          {FOURNISSEURS.map((f) => (
            <button
              key={f}
              onClick={() => toggleFournisseur(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                fournisseurFilter.includes(f)
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-visible items-center">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">État</span>
          {ETATS.map((e) => (
            <button
              key={e}
              onClick={() => toggleEtat(e)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                etatFilter.includes(e)
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {e}
            </button>
          ))}
          <span className="w-px bg-gray-300 mx-1 self-stretch shrink-0" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">Prépa</span>
          {PREPARATIONS.map((p) => (
            <button
              key={p}
              onClick={() => togglePrepa(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors shrink-0 ${
                prepaFilter.includes(p)
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
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
            >
              <X size={12} />
              Tout effacer
            </button>
          )}
        </div>
      </div>

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
                >
                  {p}
                </button>
              ),
            )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
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
    </div>
  );
}
