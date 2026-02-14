import type { Contact } from "./contact";
import type { Item, History } from "./item";

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
  history: History[];
  isLoadingHistory: boolean;
}

export interface ItemsState {
  allItems: Item[];
  items: Item[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
}

export interface MenuState {
  isMenuOpen: boolean;
}
