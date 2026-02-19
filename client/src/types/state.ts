import type { Contact } from "./contact";
import type { Item, History } from "./item";
import type { ClientFile } from "./clientFile";
import type { InterventionReport } from "./interventionReport";

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
  canDecrement?: Record<string, boolean>;
}

export interface MenuState {
  isMenuOpen: boolean;
}

export interface ClientFilesState {
  clientFiles: ClientFile[];
  selectedClientFile: ClientFile | null;
  isLoading: boolean;
}

export interface InterventionReportsState {
  reports: InterventionReport[];
  selectedReport: InterventionReport | null;
  isLoading: boolean;
}
