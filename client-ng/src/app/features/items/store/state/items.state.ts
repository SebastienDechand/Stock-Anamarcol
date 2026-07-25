import { Item, ItemHistory } from '../../../../shared/models/item/item.model';

export interface ItemsState {
  allItems: Item[];
  items: Item[];
  total: number;
  page: number;
  totalPages: number;
  loaded: boolean; // allItems (bulk, export-only) has resolved at least once
  pageLoaded: boolean; // items (paginated grid) has resolved at least once
  isLoading: boolean;
  selectedItemId: string | null;
  canDecrement: Record<string, boolean>;
  history: ItemHistory[];
  isLoadingHistory: boolean;
  error: string | null;
}

export const initialItemsState: ItemsState = {
  allItems: [],
  items: [],
  total: 0,
  page: 1,
  totalPages: 0,
  loaded: false,
  pageLoaded: false,
  isLoading: false,
  selectedItemId: null,
  canDecrement: {},
  history: [],
  isLoadingHistory: false,
  error: null,
};
