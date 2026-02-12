// ─── Redux Types ─────────────────────────────────────
import type { ThunkAction, ThunkDispatch } from "redux-thunk";
import type { Action } from "redux";
import { store } from "../index";

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = ThunkDispatch<RootState, unknown, Action>;
export type AppThunk<R = void> = ThunkAction<R, RootState, unknown, Action>;

// ─── Redux Action ────────────────────────────────────
export interface ReduxAction<T = unknown> {
  type: string;
  payload?: T;
}

// ─── User ────────────────────────────────────────────
export interface User {
  _id: string;
  pseudo: string;
  email: string;
  picture?: string;
  poste?: string;
  numero?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Item ────────────────────────────────────────────
export interface Item {
  _id: string;
  posterId: string;
  modifierName?: string;
  denomination: string;
  quantite: number;
  fournisseur: string;
  image?: string;
  etat: string;
  prepaCG?: boolean;
  prepaCaisse?: boolean;
  prepaTPV?: boolean;
  preparation?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Contact ─────────────────────────────────────────
export interface Contact {
  _id: string;
  nom?: string;
  email?: string;
  lien?: string;
  picture?: string;
  poste?: string;
  tel?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Statistics ──────────────────────────────────────
export interface GlobalStatistics {
  numberOfArticles: number;
  totalStock: number;
  numberOfSuppliers: number;
  numberOfLowStockArticles: number;
}

export interface FournisseurStats {
  numberOfArticles: number;
  totalStock: number;
  numberOfLowStockArticles: number;
  nom?: string;
}

// ─── Reducer States ──────────────────────────────────
export interface ContactsState {
  selectedContactId: string | null;
  selectedContactInfo: Contact | null;
  contactsData: Contact[];
  picture?: string;
  numero?: string;
}

export interface ItemState {
  selectedItemId: string | null;
  items: Item[];
  selectedItemQuantite: number | null;
  selectedItemInfo: Item | null;
}

export interface ItemsState {
  items: Item[];
}

export interface MenuState {
  isMenuOpen: boolean;
}

export interface StatisticsState {
  globalStatistics: GlobalStatistics;
  articlesWithLowStock: Item[];
  fournisseursStats: Record<string, FournisseurStats>;
  etatsStats: Record<string, FournisseurStats>;
  fournisseursList: string[];
  etatsList: string[];
}

// ─── Auth Context ────────────────────────────────────
export interface AuthContextType {
  uid: string | null;
  role: string | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
}

// ─── Filter ──────────────────────────────────────────
export interface Filters {
  selectedFournisseurs: string[];
  searchTerm: string;
  selectedPrepaCG: boolean;
  selectedPrepaCaisse: boolean;
  selectedPrepaTPV: boolean;
  selectedPreparation: string;
}
